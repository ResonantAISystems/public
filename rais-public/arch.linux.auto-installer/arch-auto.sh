#!/usr/bin/env bash
set -euo pipefail

# --- helpers ---------------------------------------------------------------
die(){ echo "ERROR: $*" >&2; exit 1; }
req(){ command -v "$1" >/dev/null 2>&1 || die "missing tool: $1"; }

req timedatectl
req parted
req sgdisk
req pacstrap
req genfstab
req arch-chroot
req blkid

echo ">>> Arch automated install (UEFI, ESP=512M, swap=8G, root=rest)"

# Ensure NTP/time
timedatectl set-ntp true || true

echo
lsblk -dpno NAME,SIZE,TYPE | grep "disk" || true
read -rp "Target DISK (e.g. /dev/sda or /dev/nvme0n1): " DISK
[[ -b "$DISK" ]] || die "Not a block device: $DISK"

read -rp "Hostname: " HN
[[ -n "${HN:-}" ]] || die "Hostname required"

read -rp "Optional username (Enter to skip): " NEWUSER || true
TZPATH="/usr/share/zoneinfo/America/Los_Angeles"

PARTSEP=""
[[ "$DISK" =~ (nvme|mmcblk) ]] && PARTSEP="p"

ESP="${DISK}${PARTSEP}1"
SWP="${DISK}${PARTSEP}2"
ROOT="${DISK}${PARTSEP}3"

echo ">>> Wiping partition table on $DISK"
sgdisk --zap-all "$DISK"

echo ">>> Creating GPT and partitions"
parted -s "$DISK" mklabel gpt
parted -s "$DISK" mkpart ESP fat32 1MiB 513MiB
parted -s "$DISK" set 1 esp on
parted -s "$DISK" mkpart primary linux-swap 513MiB 8705MiB
parted -s "$DISK" mkpart primary ext4 8705MiB 100%

# Some devices name partitions differently (nvme needs p)
# Rederive by ID to be safe:
mapfile -t PARTS < <(lsblk -prno NAME,PARTLABEL "$DISK" | awk '{print $1}')
# We still use ${DISK}1/2/3 (it matches both sdX and nvmeXnYpZ layouts via parted)

echo ">>> Making filesystems"
mkfs.vfat -F32 -n EFI "$ESP"
mkswap "$SWP"
mkfs.ext4 -L root "$ROOT"

echo ">>> Mounting"
mount "$ROOT" /mnt
mkdir -p /mnt/boot
mount "$ESP" /mnt/boot
swapon "$SWP"

echo ">>> Installing base"
pacstrap /mnt base linux linux-firmware networkmanager efibootmgr nvim

echo ">>> Generating fstab"
genfstab -U /mnt >> /mnt/etc/fstab

echo ">>> System configuration inside chroot"
arch-chroot /mnt /bin/bash -e <<CHROOT
set -euo pipefail

ln -sf $TZPATH /etc/localtime
hwclock --systohc
sed -i 's/^#\(en_US\.UTF-8 UTF-8\)/\1/' /etc/locale.gen
locale-gen
printf "LANG=en_US.UTF-8\n" > /etc/locale.conf

echo "$HN" > /etc/hostname
cat >/etc/hosts <<EOF
127.0.0.1   localhost
::1         localhost
127.0.1.1   $HN.localdomain $HN
EOF

systemctl enable NetworkManager.service

# Bootloader
bootctl install
ROOT_UUID=\$(blkid -s UUID -o value $ROOT)
mkdir -p /boot/loader/entries
cat >/boot/loader/loader.conf <<EOF
default arch.conf
timeout 3
console-mode max
editor no
EOF
cat >/boot/loader/entries/arch.conf <<EOF
title   Arch Linux
linux   /vmlinuz-linux
initrd  /initramfs-linux.img
options root=UUID=\$ROOT_UUID rw
EOF

# Optional user
if [[ -n "${NEWUSER:-}" ]]; then
  useradd -m -G wheel,audio,video,storage -s /bin/bash "$NEWUSER"
  # Uncomment wheel sudoers line
  sed -i 's/^# \(%wheel ALL=(ALL:ALL) ALL\)/\1/' /etc/sudoers
fi
CHROOT

echo
echo ">>> All done. Set passwords then reboot:"
echo "    arch-chroot /mnt passwd"
[[ -n "${NEWUSER:-}" ]] && echo "    arch-chroot /mnt passwd ${NEWUSER}"
echo "    umount -R /mnt && swapoff -a && reboot"

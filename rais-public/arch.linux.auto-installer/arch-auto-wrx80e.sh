#!/usr/bin/env bash
set -euo pipefail

# ====================== helpers ======================
die(){ echo "ERROR: $*" >&2; exit 1; }
req(){ command -v "$1" >/dev/null 2>&1 || die "missing tool: $1"; }
say(){ echo -e "\n>>> $*\n"; }

req timedatectl; req sgdisk; req parted; req pacstrap; req genfstab; req arch-chroot; req blkid; req lsblk

timedatectl set-ntp true || true

# ================== pick target disk =================
say "Select TARGET DISK by stable ID (prevents nvmeXnY confusion)"
echo "Available disks:"
ls -1 /dev/disk/by-id/ | grep -E 'nvme|ata' | sed 's#^#/dev/disk/by-id/#' | while read -r D; do
  [[ -b "$D" ]] || continue
  real=$(readlink -f "$D")
  size=$(lsblk -dpno SIZE "$real")
  echo "  $D -> $real ($size)"
done

read -rp "Enter full /dev/disk/by-id/... of target DISK: " DISK_ID
[[ -e "$DISK_ID" ]] || die "No such path: $DISK_ID"
DISK_REAL="$(readlink -f "$DISK_ID")"
[[ -b "$DISK_REAL" ]] || die "Not a block device: $DISK_REAL"

echo "You are about to WIPE $DISK_ID -> $DISK_REAL"
read -rp 'Type ERASE to continue: ' CONFIRM
[[ "${CONFIRM:-}" == "ERASE" ]] || die "Aborted"

# Partition prefix (nvme needs 'p')
PARTPRE=""
[[ "$DISK_REAL" =~ [0-9]$ ]] && PARTPRE="p"

ESP="${DISK_REAL}${PARTPRE}1"
SWP="${DISK_REAL}${PARTPRE}2"
ROOT="${DISK_REAL}${PARTPRE}3"

# =================== gather basics ===================
read -rp "Hostname: " HN; [[ -n "${HN:-}" ]] || die "Hostname required"
read -rp "Optional username (Enter to skip): " NEWUSER || true
TZPATH="/usr/share/zoneinfo/America/Los_Angeles"

# ================== carve & format ===================
say "Wiping and partitioning $DISK_REAL (ESP=512MiB, swap=8GiB, root=rest)"
sgdisk --zap-all "$DISK_REAL"
parted -s "$DISK_REAL" mklabel gpt
parted -s "$DISK_REAL" mkpart ESP fat32 1MiB 513MiB
parted -s "$DISK_REAL" set 1 esp on
parted -s "$DISK_REAL" mkpart primary linux-swap 513MiB 8705MiB
parted -s "$DISK_REAL" mkpart primary ext4 8705MiB 100%

# ensure kernel sees new table
partprobe "$DISK_REAL"
sleep 2

say "Creating filesystems"
mkfs.vfat -F32 -n EFI "$ESP"
mkswap "$SWP"
mkfs.ext4 -L root "$ROOT"

say "Mounting"
mount "$ROOT" /mnt
mkdir -p /mnt/boot
mount "$ESP" /mnt/boot
swapon "$SWP"

# ===================== base install ==================
say "Installing base system (lean)"
# add amd-ucode; nvidia stack will be added inside chroot
pacstrap /mnt base linux linux-firmware amd-ucode networkmanager efibootmgr neovim

say "Generating fstab"
genfstab -U /mnt >> /mnt/etc/fstab

# =================== configure system =================
say "Configuring inside chroot"
arch-chroot /mnt /bin/bash -e <<CHROOT
set -euo pipefail

TZPATH="$TZPATH"; HN="$HN"; ROOT_PART="$ROOT"

ln -sf "\$TZPATH" /etc/localtime
hwclock --systohc

sed -i 's/^#\(en_US\.UTF-8 UTF-8\)/\1/' /etc/locale.gen
locale-gen
printf "LANG=en_US.UTF-8\n" > /etc/locale.conf

echo "\$HN" > /etc/hostname
cat >/etc/hosts <<EOF
127.0.0.1   localhost
::1         localhost
127.0.1.1   \$HN.localdomain \$HN
EOF

systemctl enable NetworkManager.service

# systemd-boot
bootctl install
ROOT_UUID=\$(blkid -s UUID -o value "\$ROOT_PART")
mkdir -p /boot/loader/entries
cat >/boot/loader/loader.conf <<EOF
default arch.conf
timeout 3
console-mode max
editor no
EOF
cat >/boot/loader/entries/arch.conf <<EOF
title   Arch Linux (WRX80E)
linux   /vmlinuz-linux
initrd  /amd-ucode.img
initrd  /initramfs-linux.img
options root=UUID=\$ROOT_UUID rw
EOF

# minimal desktop & NVIDIA for RTX A6000 (Ampere)
pacman -Syu --noconfirm \
  xorg-server xfce4 xfce4-goodies lightdm lightdm-gtk-greeter \
  nvidia nvidia-utils nvidia-settings \
  mesa-utils xorg-xinit \
  git base-devel  # small quality of life

# enable display manager
install -D /dev/null /etc/lightdm/lightdm.conf.d/10-gtk-greeter.conf
cat >/etc/lightdm/lightdm.conf.d/10-gtk-greeter.conf <<'EOF'
[Seat:*]
greeter-session=lightdm-gtk-greeter
EOF
systemctl enable lightdm.service

# (optional) create user with sudo
if [[ -n "\${NEWUSER:-}" ]]; then
  useradd -m -G wheel,audio,video,storage -s /bin/bash "\$NEWUSER"
  install -Dm440 /dev/stdin /etc/sudoers.d/10-wheel <<'EOS'
%wheel ALL=(ALL:ALL) ALL
EOS
fi

# ensure initramfs is current (good after nvidia install)
mkinitcpio -P
CHROOT

say "Base install complete."
echo "Next steps:"
echo "  arch-chroot /mnt passwd"
[[ -n "${NEWUSER:-}" ]] && echo "  arch-chroot /mnt passwd ${NEWUSER}"
echo "  umount -R /mnt && swapoff -a && reboot"

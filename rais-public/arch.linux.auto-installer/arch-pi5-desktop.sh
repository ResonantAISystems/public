#!/usr/bin/env bash
set -euo pipefail

# ====================== helpers ======================
die(){ echo "ERROR: $*" >&2; exit 1; }
req(){ command -v "$1" >/dev/null 2>&1 || die "missing tool: $1"; }
say(){ echo -e "\n>>> $*\n"; }

# Check for required tools
req timedatectl; req parted; req sgdisk; req pacstrap; req genfstab; req arch-chroot; req blkid; req lsblk

# Set system clock
say "Setting up system clock"
timedatectl set-ntp true || true

# ================== pick target disk =================
say "Select TARGET SD CARD or USB DISK for Raspberry Pi 5"
echo "Available disks:"
lsblk -dpno NAME,SIZE,MODEL | grep -v "^/dev/loop" | grep -v "^/dev/sr" | grep -v "^/dev/ram" | while read -r line; do
  echo "  $line"
done

read -rp "Enter target device (e.g., /dev/mmcblk0 or /dev/sdX): " DISK
[[ -b "$DISK" ]] || die "Not a block device: $DISK"

# Confirm before wiping
echo -e "\nWARNING: This will ERASE ALL DATA on $DISK"
read -rp 'Type ERASE to continue: ' CONFIRM
[[ "${CONFIRM:-}" == "ERASE" ]] || die "Aborted"

# Partition prefix (mmcblk needs 'p')
PARTPRE=""
[[ "$DISK" =~ mmcblk ]] && PARTPRE="p"

ESP="${DISK}${PARTPRE}1"
ROOT="${DISK}${PARTPRE}2"

# =================== gather basics ===================
read -rp "Hostname: " HN; [[ -n "${HN:-}" ]] || die "Hostname required"
TZPATH="/usr/share/zoneinfo/America/Los_Angeles"

# ================== carve & format ===================
say "Wiping and partitioning $DISK (ESP=512MiB, root=rest)"
sgdisk --zap-all "$DISK"
parted -s "$DISK" mklabel gpt
parted -s "$DISK" mkpart ESP fat32 1MiB 513MiB
parted -s "$DISK" set 1 esp on
parted -s "$DISK" mkpart primary ext4 513MiB 100%

# Format partitions
say "Formatting partitions"
mkfs.fat -F32 "$ESP"
mkfs.ext4 -F "$ROOT"

# Mount partitions
say "Mounting filesystems"
mount "$ROOT" /mnt
mkdir -p /mnt/boot/efi
mount "$ESP" /mnt/boot/efi

# ================== install base ===================
say "Installing Arch Linux ARM for Raspberry Pi 5 with XFCE4"
pacstrap /mnt base base-devel linux-rpi5 linux-firmware raspberrypi-firmware raspberrypi-bootloader \
  networkmanager sudo vim bash-completion man-db man-pages texinfo \
  xorg-server xorg-xinit xorg-xrandr xorg-xsetroot \
  xfce4 xfce4-goodies lightdm lightdm-gtk-greeter \
  firefox alacritty htop neofetch vim openssh wget curl git \
  python python-pip nodejs npm zsh zsh-syntax-highlighting zsh-autosuggestions

# Generate fstab
say "Generating fstab"
genfstab -U /mnt >> /mnt/etc/fstab

# ================== system configuration ===================
say "Configuring system"

# Set timezone
arch-chroot /mnt ln -sf "$TZPATH" /etc/localtime
arch-chroot /mnt hwclock --systohc

# Set hostname
echo "$HN" > /mnt/etc/hostname

# Configure locale
cat > /mnt/etc/locale.gen << EOF
en_US.UTF-8 UTF-8
en_US ISO-8859-1
EOF
arch-chroot /mnt locale-gen
echo "LANG=en_US.UTF-8" > /mnt/etc/locale.conf

# Configure keymap
echo "KEYMAP=us" > /mnt/etc/vconsole.conf

# Configure network
cat > /mnt/etc/hosts << EOF
127.0.0.1   localhost
::1         localhost
127.0.1.1   $HN.localdomain $HN
EOF

# Enable services
arch-chroot /mnt systemctl enable NetworkManager
arch-chroot /mnt systemctl enable lightdm

# Configure LightDM for autologin
mkdir -p /mnt/etc/lightdm
cat > /mnt/etc/lightdm/lightdm.conf << 'EOF'
[Seat:*]
autologin-user=root
autologin-session=xfce
EOF

# Configure XFCE4 session for root
mkdir -p /mnt/root/.config/xfce4/xfconf/xfce-perchannel-xml
cat > /mnt/root/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-desktop.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<channel name="xfce4-desktop" version="1.0">
  <property name="desktop-icons" type="empty">
    <property name="file-icons" type="empty">
      <property name="show-home" type="bool" value="true"/>
      <property name="show-filesystem" type="bool" value="false"/>
      <property name="show-removable" type="bool" value="true"/>
      <property name="show-trash" type="bool" value="true"/>
    </property>
  </property>
</channel>
EOF

# Configure bootloader
cat > /mnt/boot/efi/config.txt << EOF
[all]
arm_64bit=1
kernel=vmlinuz-linux-rpi5
initramfs initramfs-linux-rpi5.img
dtoverlay=vc4-kms-v3d-pi5
dtparam=audio=on
dtparam=usb=on
# Uncomment to disable Wi-Fi and Bluetooth
#dtoverlay=disable-wifi
#dtoverlay=disable-bt
EOF

# Configure cmdline.txt
cat > /mnt/boot/efi/cmdline.txt << EOF
root=PARTUUID=$(blkid -s PARTUUID -o value "$ROOT") rw rootwait console=tty1 console=ttyAMA0,115200 console=serial0,115200 fsck.repair=yes fsck.mode=force loglevel=3 quiet
EOF

# Set root password at the end
say "Set root password:"
arch-chroot /mnt passwd

# Final message
say "Installation complete!"
echo "To boot your new system:"
echo "1. Unmount the SD card:"
echo "   umount -R /mnt"
echo "2. Insert the SD card into your Raspberry Pi 5"
echo "3. Power on the Raspberry Pi 5"
echo "4. The system will automatically log in to XFCE4 as root"

# Unmount all partitions
umount -R /mnt

say "All done! You can now remove the SD card and boot it in your Raspberry Pi 5."

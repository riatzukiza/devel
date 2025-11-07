# 1) unmount
sudo umount /mnt/easystore

# 2) clear the NTFS dirty/hibernation flag (lightweight; NOT a full chkdsk)
sudo ntfsfix /dev/sdb1

# 3) remount RW using the kernel ntfs3 driver
sudo mount -t ntfs3 -o uid=$(id -u),gid=$(id -g) /dev/sdb1 /mnt/easystore

# 1) Unmount your manual mount
sudo umount /dev/sdb1

# 2) Ensure desktop helpers are installed
sudo apt install -y udisks2 gvfs gvfs-backends gvfs-fuse policykit-1

# 3) Mount as your user (udisks picks /media/$USER/LABEL)
udisksctl mount -b /dev/sdb1

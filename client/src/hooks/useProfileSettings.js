import { useState, useEffect } from 'react';
import api from '@/configs/api';
import toast from 'react-hot-toast';

export function useProfileSettings(user, updateUser) {
    const [profileName, setProfileName] = useState(user?.name || '');
    const [profileImage, setProfileImage] = useState(user?.image || '');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    useEffect(() => {
        setProfileName(user?.name || '');
        setProfileImage(user?.image || '');
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (!profileName.trim()) return toast.error('Name is required');
        setIsUpdatingProfile(true);
        try {
            const { data } = await api.put('/api/auth/profile', { name: profileName, image: profileImage });
            updateUser(data.user);
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (!currentPassword || !newPassword) return toast.error('Please fill in password fields');
        if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
        setIsUpdatingPassword(true);
        try {
            await api.put('/api/auth/password', { currentPassword, newPassword });
            toast.success('Password updated successfully');
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update password');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    return {
        profileName, setProfileName, profileImage, setProfileImage, isUpdatingProfile, handleUpdateProfile,
        currentPassword, setCurrentPassword, newPassword, setNewPassword, confirmPassword, setConfirmPassword,
        isUpdatingPassword, handleUpdatePassword
    };
}

"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { api, fetchAuthedMedia } from "@/lib/api";

export default function EmployeeProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);

  useEffect(() => {
    api.employeeProfile().then((p) => {
      setProfile(p);
      setPhone(p.phone || "");
    });
  }, []);

  async function saveProfile() {
    setMessage(null);
    try {
      const updated = await api.updateProfile({ phone });
      setProfile(updated);
      setMessage("Profile updated.");
    } catch (e: any) {
      setMessage(e.message);
    }
  }

  async function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const res = await api.uploadProfilePhoto(file);
      setProfile((p: any) => ({ ...p, profile_photo_url: res.profile_photo_url }));
      setMessage("Photo uploaded.");
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function savePassword() {
    setMessage(null);
    try {
      await api.changePassword(currentPassword, newPassword);
      setMessage("Password changed.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (e: any) {
      setMessage(e.message);
    }
  }

  useEffect(() => {
    if (!profile?.profile_photo_url) {
      setPhotoSrc(null);
      return;
    }
    let active = true;
    let objectUrl: string | null = null;
    fetchAuthedMedia(profile.profile_photo_url).then((url) => {
      if (!active) {
        if (url) URL.revokeObjectURL(url);
        return;
      }
      objectUrl = url;
      setPhotoSrc(url);
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [profile?.profile_photo_url]);

  if (!profile) return <p>Loading profile...</p>;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Employee" title="My Profile" description="View and update your permitted profile information." />
      {message ? <p className="text-sm text-brand">{message}</p> : null}
      <div className="card grid gap-4 p-6 md:grid-cols-2">
        <div className="md:col-span-2 flex items-center gap-4">
          {photoSrc ? (
            <img src={photoSrc} alt={profile.name} className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ink/10 text-2xl font-display">{profile.name?.[0]}</div>
          )}
          <div>
            <label className="btn-secondary cursor-pointer text-xs">
              {uploading ? "Uploading..." : "Upload photo"}
              <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={onPhotoChange} disabled={uploading} />
            </label>
            <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP — max 5MB</p>
          </div>
        </div>
        <div><p className="kpi-label">Full Name</p><p className="mt-1">{profile.name}</p></div>
        <div><p className="kpi-label">Email</p><p className="mt-1">{profile.email}</p></div>
        <div><p className="kpi-label">Employee ID</p><p className="mt-1">{profile.employee_code}</p></div>
        <div><p className="kpi-label">Job Title</p><p className="mt-1">{profile.job_title || "—"}</p></div>
        <div><p className="kpi-label">Department</p><p className="mt-1">{profile.department_name || "—"}</p></div>
        <div><p className="kpi-label">Joining Date</p><p className="mt-1">{profile.joining_date || "—"}</p></div>
        <div>
          <label className="kpi-label" htmlFor="profile-phone">Phone</label>
          <input id="profile-phone" className="input mt-1 w-full" autoComplete="tel" maxLength={30} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <button type="button" className="btn-primary md:col-span-2" onClick={saveProfile}>Save Profile</button>
      </div>
      <div className="card space-y-4 p-6">
        <h2 className="font-display text-lg">Change Password</h2>
        <input className="input w-full" type="password" autoComplete="current-password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        <input className="input w-full" type="password" autoComplete="new-password" placeholder="New password (letter and number, 8+ characters)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <button type="button" className="btn-secondary" onClick={savePassword}>Update Password</button>
      </div>
    </div>
  );
}

import { ProfileSocialButtons } from "./ProfileSocialButtons";



export const ProfileSocial = ({ user }) => {
  return (
    <div className="flex gap-3 mt-4">
      <ProfileSocialButtons user={user} />
    </div>
  );
};
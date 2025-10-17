import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ProfileBannerProps {
  bannerUrl?: string;
}

export const ProfileBanner = ({ bannerUrl }: ProfileBannerProps) => {
  return (
    <div className="relative w-full h-[300px] bg-gray-100 overflow-hidden">
      {bannerUrl ? (
        <img
          src={bannerUrl}
          alt="Profile banner"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gray-200" />
      )}
    </div>
  );
};
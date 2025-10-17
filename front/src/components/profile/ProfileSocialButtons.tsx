import { Button } from "@/components/ui/button";
import { LinkedinIcon, YoutubeIcon, GithubIcon, Music2Icon, InstagramIcon, FacebookIcon, GlobeIcon } from "lucide-react";




export const ProfileSocialButtons = ({ user }) => {

  const socialButtons = [
    {
      url: user.links?.find((link) => link.link_type === "website")?.url,
      icon: GlobeIcon,
      label: "Website",
      ariaLabel: "Visiter le site web"
    },
    {
      url: user.links?.find((link) => link.link_type === "linkedin")?.url,
      icon: LinkedinIcon,
      label: "LinkedIn",
      ariaLabel: "Visiter le profil LinkedIn"
    },
    {
      url: user.links?.find((link) => link.link_type === "github")?.url,
      icon: GithubIcon,
      label: "GitHub",
      ariaLabel: "Visiter le profil GitHub"
    },
    {
      url: user.links?.find((link) => link.link_type === "youtube")?.url,
      icon: YoutubeIcon,
      label: "YouTube",
      ariaLabel: "Visiter la chaîne YouTube"
    },
    {
      url: user.links?.find((link) => link.link_type === "spotify")?.url,
      icon: Music2Icon,
      label: "Spotify",
      ariaLabel: "Écouter sur Spotify"
    },
    {
      url: user.links?.find((link) => link.link_type === "instagram")?.url,
      icon: InstagramIcon,
      label: "Instagram",
      ariaLabel: "Visiter le profil Instagram"
    },
    {
      url: user.links?.find((link) => link.link_type === "facebook")?.url,
      icon: FacebookIcon,
      label: "Facebook",
      ariaLabel: "Visiter le profil Facebook"
    }
  ];

  return (
    <>
      {socialButtons.map((button, index) => (
        button.url && (
          <Button
            key={index}
            variant="outline"
            size="icon"
            asChild
          >
            <a
              href={button.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={button.ariaLabel}
            >
              <button.icon className="h-4 w-4" />
            </a>
          </Button>
        )
      ))}
    </>
  );
};
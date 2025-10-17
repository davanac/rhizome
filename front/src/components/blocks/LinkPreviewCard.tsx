import { ExternalLinkIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface LinkPreviewCardProps {
  url: string;
  title?: string;
  thumbnail?: string;
}

export const LinkPreviewCard = ({ url }: LinkPreviewCardProps) => {
  // Extract domain name for display
  const domain = url ? new URL(url).hostname : '';

  // Fetch metadata for the URL
  const { data: metadata } = useQuery({
    queryKey: ['linkPreview', url],
    queryFn: async () => {
      try {
        const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
          console.warn(`Failed to fetch preview for ${url}:`, response.statusText);
          return { title: domain };
        }
        const data = await response.json();
        return data.data;
      } catch (error) {
        console.warn(`Error fetching preview for ${url}:`, error);
        return { title: domain };
      }
    },
    enabled: !!url,
    retry: 1,
  });

  const linkTitle = metadata?.title || domain;
  const linkImage = metadata?.image?.url || metadata?.logo?.url;

  // Function to get YouTube video ID from URL
  const getYoutubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Function to get Instagram post ID from URL
  const getInstagramPostId = (url: string) => {
    const regExp = /instagram.com\/p\/([^/?#&]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  // Function to get TikTok video ID from URL
  const getTikTokVideoId = (url: string) => {
    const regExp = /tiktok.com\/@[^/]+\/video\/(\d+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  // Helper function to validate domain against allowed list
  const isValidDomain = (url: string, allowedDomains: string[]): boolean => {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();

      return allowedDomains.some(domain => {
        // Exact match or subdomain match (e.g., m.youtube.com matches youtube.com)
        return hostname === domain || hostname.endsWith('.' + domain);
      });
    } catch {
      return false;
    }
  };

  // Render appropriate embed based on URL type
  const renderEmbed = () => {
    if (!url) return null;

    try {
      // YouTube validation - only allow official YouTube domains
      const youtubeAllowedDomains = ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'];
      if (isValidDomain(url, youtubeAllowedDomains)) {
        const videoId = getYoutubeVideoId(url);
        if (videoId) {
          return (
            <div className="aspect-video w-full">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }
      }

      // Instagram validation - only allow official Instagram domains
      const instagramAllowedDomains = ['instagram.com', 'www.instagram.com'];
      if (isValidDomain(url, instagramAllowedDomains)) {
        const postId = getInstagramPostId(url);
        if (postId) {
          return (
            <div className="aspect-square w-full">
              <iframe
                src={`https://www.instagram.com/p/${postId}/embed`}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          );
        }
      }

      // TikTok validation - only allow official TikTok domains
      const tiktokAllowedDomains = ['tiktok.com', 'www.tiktok.com', 'm.tiktok.com'];
      if (isValidDomain(url, tiktokAllowedDomains)) {
        const videoId = getTikTokVideoId(url);
        if (videoId) {
          return (
            <div className="aspect-[9/16] w-full max-w-[325px] mx-auto">
              <iframe
                src={`https://www.tiktok.com/embed/v2/${videoId}`}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          );
        }
      }

      return linkImage && (
        <img
          src={linkImage}
          alt={linkTitle}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      );
    } catch (error) {
      console.warn('Error rendering embed:', error);
      return null;
    }
  };

  if (!url) return null;

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow transition-all hover:shadow-lg">
      <div className="aspect-video w-full overflow-hidden">
        {renderEmbed()}
      </div>
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ExternalLinkIcon className="h-4 w-4" />
          <span>{domain}</span>
        </div>
        
        <h3 className="font-semibold line-clamp-2">{linkTitle}</h3>
        
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="absolute inset-0"
        >
          <span className="sr-only">Visit {linkTitle}</span>
        </a>
      </div>
    </div>
  );
};
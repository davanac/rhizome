import { decodeHtmlEntities } from '@/utils/textUtils';

interface ProfileInfoProps {
  firstName?: string;
  lastName?: string;
  name?: string;
  username?: string;
  accountType?: string;
  expertise?: string;
  collectif?: string;
}

export const ProfileInfo = ({
  firstName,
  lastName,
  name,
  username,
  accountType,
  expertise,
  collectif
}: ProfileInfoProps) => {
  const isCollectif = accountType?.toLowerCase() === 'collectif' ||
                     accountType === 'Collectif';

  return (
    <div className="text-center mt-4">
      {isCollectif ? (
        <>
          <h1 className="text-2xl font-bold text-gray-900">
            {decodeHtmlEntities(collectif)}
          </h1>
          <p className="text-gray-500 mt-1">@{username}</p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-gray-900">
            {firstName && lastName
              ? `${decodeHtmlEntities(firstName)} ${decodeHtmlEntities(lastName)}`
              : decodeHtmlEntities(name)}
          </h1>
          <p className="text-gray-500 mt-1">@{username}</p>
          {expertise && (
            <p className="text-gray-600 mt-2 font-medium">{decodeHtmlEntities(expertise)}</p>
          )}
        </>
      )}
    </div>
  );
};
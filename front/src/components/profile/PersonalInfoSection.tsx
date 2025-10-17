import { useEffect, useState } from "react";
import { ParticularFields } from "./fields/ParticularFields";
import { EnterpriseFields } from "./fields/EnterpriseFields";
import { BioField } from "./fields/BioField";
import { UsernameField } from "./fields/UsernameField";
import { Enterprise } from "./types/Enterprise";

interface PersonalInfoSectionProps {
  firstName: string;
  lastName: string;
  expertise: string;
  collectif: string;
  bio: string;
  username: string;
  accountType: string;
  required?: boolean;
  onFieldChange: (field: string, value: string) => void;
}

export const PersonalInfoSection = ({
  firstName,
  lastName,
  expertise,
  collectif,
  bio,
  username,
  accountType,
  required = false,
  onFieldChange,
}: PersonalInfoSectionProps) => {
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);



  return (
    <div className="space-y-4">
      <UsernameField
        username={username}
        onFieldChange={onFieldChange}
      />

      {accountType === 'individual' ? (
        <ParticularFields
          firstName={firstName}
          lastName={lastName}
          expertise={expertise}
          collectif={collectif}
          enterprises={enterprises}
          required={false}
          onFieldChange={onFieldChange}
        />
      ) : (
        <EnterpriseFields
          collectif={collectif}
          required={required}
          onFieldChange={onFieldChange}
        />
      )}

      <BioField
        bio={bio}
        accountType={accountType}
        required={required}
        onFieldChange={onFieldChange}
      />
    </div>
  );
};
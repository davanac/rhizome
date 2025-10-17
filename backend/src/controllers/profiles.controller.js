//path: src/controllers/profiles.controller.js
import * as ProfilesService from "#services/profiles.service.js";
import Config from "#config";

// Récupérer tous les profils d'un utilisateur connecté (seulement ses propres profils)
export const getUserProfiles = async (req, reply) => {
  const userId = req.user.userId;
  const profiles = await ProfilesService.getAllProfilesByUserId(userId);
  reply.send(profiles);
};

// Get all profiles from all users (for authenticated users to select collaborators)
export const getAllProfiles = async (req, reply) => {
  const profiles = await ProfilesService.getAllProfiles();
  
  if (profiles?.success === false) {
    return reply.status(500).send({
      success: false,
      message: profiles.message || "Error fetching profiles",
      errorCode: profiles.errorCode,
      errorKey: profiles.errorKey
    });
  }
  
  reply.send({
    success: true,
    profiles: profiles || []
  });
};


const getAllFilteredProfiles = async (userId) => {
  const profiles = await ProfilesService.getAllProfilesByUserId(userId);
  if (profiles.success === false) {
    return {
      success: false,
      message: "Failed to retrieve profiles",
      errorKey: 887704,
      errorCode: "failed-to-retrieve-profiles",
      fromError: !Config.IN_PROD ? profiles : null,
    };
  }
  //return profiles;

  // 3️⃣ Identifier le profil principal "individual"
  const individualProfile =
    profiles?.find((p) => p.profile_type_id === 1) || null;
  let primaryProfile = null;

  if (individualProfile) {
    primaryProfile = await ProfilesService.getProfileById(individualProfile.id);

    /** ------------------ cmt 786968 ------------------
        primaryProfile = individualProfile;
        primaryProfile.type = "individual";
        *-------------------------------------------------*/
  }

  const otherProfiles =
    profiles?.filter((p) => p.profile_type_id === 2) || null;

  console.log(
    "=== otherProfiles.length === profiles.controller.js === key: 522834 ==="
  );
  console.dir(otherProfiles.length, { depth: null, colors: true });
  console.log("=================================");

  const otherProfilesDetails = [];
  for (const profile of otherProfiles) {
    const profileDetails = await ProfilesService.getProfileById(profile.id);
    console.log(
      "=== profileDetails === profiles.controller.js === key: 532556 ==="
    );
    console.dir(profileDetails, { depth: null, colors: true });
    console.log("=================================");
    otherProfilesDetails.push(profileDetails);
  }

  console.log(
    "=== otherProfilesDetails.length === profiles.controller.js === key: 508408 ==="
  );
  console.dir(otherProfilesDetails.length, { depth: null, colors: true });
  console.log("=================================");

  if (primaryProfile) {
    otherProfilesDetails.unshift(primaryProfile);
  }
  return {
    userId,
    profiles: otherProfilesDetails || [],
    primaryProfile, // Le profil principal "individual" en détail
    otherProfiles,
  };
};

export const checkUsername = async (req, reply) => {
  if (!req?.params?.username) {
    return reply.status(400).send({
      success: false,
      message: "Invalid request",
      errorCode: "missing-username",
      errorKey: 679239,
    });
  }

  const username = req.params?.username || "";

  const usernameRegex = /^[a-z0-9_]+(?:-[a-z0-9_]+)*$/;

  function isUsernameValid(username) {
    return usernameRegex.test(username);
  }

  if (!isUsernameValid(username)) {
    return reply.status(400).send({
      success: false,
      message: "Invalid username format",
      errorKey: 632914,
      errorCode: "invalid-username-format",
      username,
    });
  }

  const usernameAlreadyExists = await ProfilesService.usernameExists(username);

  if (usernameAlreadyExists?.success === false) {
    return reply.status(400).send({
      success: false,
      message: "Error checking username",
      errorKey: 909682,
      errorCode: "username-check-error",
      fromError: !Config.IN_PROD ? usernameAlreadyExists : null,
    });
  }

  if (usernameAlreadyExists) {
    return {
      success: false,
      message: "Username already exists",
      errorKey: 586363,
      errorCode: "username-already-exists",
      username,
    };
  }

  return {
    success: true,
    message: "Username is available",
    data: { username },
  };
};

// Créer un nouveau profil
export const createProfile = async (req, reply) => {
  console.log("=== req.user === profiles.controller.js === key: 928992 ===");
  console.dir(req.user, { depth: null, colors: true });
  console.log("=================================");
  const userId = req.user?.userId;
  if (!userId) {
    return reply.status(401).send({
      success: false,
      message: "User not identified",
      errorCode: "user-not-identified",
      errorKey: 752274,
    });
  }
  if (req.body.userId !== userId) {
    return reply.status(403).send({
      success: false,
      message: "Forbidden - You do not have access to this profile",
      errorCode: "forbidden",
      errorKey: 752274,
    });
  }

  const newProfile = await ProfilesService.createProfile(req.body);
  
  // Check if profile creation failed
  if (newProfile?.success === false) {
    // Use 409 Conflict for duplicate username
    const statusCode = newProfile.errorCode === "username-already-exists" ? 409 : 500;
    return reply.status(statusCode).send({
      success: false,
      message: newProfile.message,
      errorCode: newProfile.errorCode,
      errorKey: newProfile.errorKey,
      fromError: newProfile.fromError
    });
  }
  
  newProfile.profile_type = req.body.accountType || "individual";
  reply.status(201).send(newProfile);
};

// Récupérer un profil spécifique par son ID
export const getProfileById = async (req, reply) => {
  const { profileId } = req.params;

  // 1️⃣ Vérifier si `profileId` est fourni
  if (!profileId) {
    return reply.status(400).send({
      success: false,
      message: "Missing profileId",
      errorKey: 723384,
    });
  }

  // 2️⃣ Récupérer le profil depuis la DB
  const profile = await ProfilesService.getProfileById(profileId);

  // 3️⃣ Vérifier si le profil existe
  if (!profile) {
    return reply.status(404).send({
      success: false,
      message: "Profile not found",
      errorKey: 399249,
    });
  }

  // Profile ownership is now verified by requireProfileOwnership middleware
  // Use the profile from req.profile to avoid duplicate DB query
  reply.send(req.profile || profile);
};

// Récupérer un profil spécifique par son ID
export const getProfileByUsername = async (req, reply) => {
  const { username } = req.params;

  // 1️⃣ Vérifier si `profileId` est fourni
  if (!username) {
    return reply.status(400).send({
      success: false,
      message: "Missing username",
      errorKey: 477492,
    });
  }

  // 2️⃣ Récupérer le profil depuis la DB
  const profile = await ProfilesService.getProfileByUsername(username);

  // 3️⃣ Vérifier si le profil existe
  if (!profile) {
    return reply.status(404).send({
      success: false,
      message: "Profile not found",
      errorKey: 269136,
    });
  }

  reply.send(profile);
};

// Mettre à jour un profil
export const updateProfile = async (req, reply) => {
  console.log("=== req?.user === profiles.controller.js === key: 936107 ===");
  console.dir(req?.user, { depth: null, colors: true });
  console.log("=================================");

  const { profileId } = req.params;
  const profileData = { ...req.body };

  if (!profileId) {
    return reply.status(400).send({
      success: false,
      message: "Missing profileId",
      errorKey: 986744,
      errorCode: "missing-profile-id",
    });
  }

  // on vérifie que tous les champs requis dans updateProfile de profiles.service.js sont bien présents dans profileData
  const requiredFields = [
    /*"firstName",
    "lastName",
    "username",
    "bio",
    "avatarUrl",
    "bannerUrl",*/
    //"expertise",
  ];
  const missingFields = requiredFields.filter((field) => !profileData[field]);
  if (missingFields.length) {
    return reply.status(400).send({
      success: false,
      message: `Missing fields: ${missingFields.join(", ")}`,
      errorKey: 669535,
      errorCode: "missing-fields",
    });
  }

  // Formater le champ expertise en remplaçant les multiples espaces par un seul espace
  profileData.expertise &&
    (profileData.expertise =
      profileData.expertise.replace(/\s+/g, " ").trim() || "");

  //on vérifie que le username est structuré correctement
  //uniquement des minuscules, des chiffres et des traits d'union
  // jamais de double trait d'union
  // ne commence pas ou ne se termine pas par un trait d'union
  // on le corrige en cas de besoin en remplaçant les espaces par des traits d'union
  // et en mettant tout en minuscules
  // et en supprimant les caractères interdits et en retirant les traits d'union en début et fin de chaîne
  profileData.username = profileData.username
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");

  //on appelle le service usernameExists pour vérifier si le username existe déjà pour un autre id de profile
  const usernameExists = await ProfilesService.usernameExists(
    profileData.username,
    profileId
  );
  if (usernameExists) {
    return reply.status(400).send({
      success: false,
      message: "Username already exists",
      errorKey: 800276,
      errorCode: "username-already-exists",
      username: profileData.username,
    });
  }

  // Construction du tableau de liens à mettre à jour
  let linksToUpdate = [];

  // Si le payload ne contient pas de clé "links", on reconstruit le tableau à partir des clés sociales connues
  const socialKeys = [
    "linkedin",
    "github",
    "instagram",
    "facebook",
    "youtube",
    "spotify",
    "discord",
    "slack",
    "dribbble",
    "behance",
    "strava",
    "twitter",
    "website",
  ];
  socialKeys.forEach((key) => {
    if (profileData[key] && profileData[key].trim() !== "") {
      linksToUpdate.push({
        link_type: key,
        url: profileData[key],
        link_label: key.charAt(0).toUpperCase() + key.slice(1),
      });
    }
  });

  profileData.links = linksToUpdate;

  const updatedProfile = await ProfilesService.updateProfile(
    profileId,
    profileData
  );
  if (!updatedProfile || updatedProfile.success === false) {
    return reply.status(404).send({
      success: false,
      message: "Profile not found or update failed",
      errorKey: 648616,
      errorCode: "profile-not-found-or-update-failed",
      fromError: !Config.IN_PROD ? updatedProfile : null,
    });
  }

  console.log("=== req.user === profiles.controller.js === key: 138325 ===");
  console.dir(req.user, { depth: null, colors: true });
  console.log("=================================");

  const allProfiles = await getAllFilteredProfiles(req.user?.userId);

  console.log("=== allProfiles === profiles.controller.js === key: 611757 ===");
  console.dir(allProfiles.length, { depth: null, colors: true });
  console.log("=================================");

  reply.send({
    success: true,
    message: "Profile updated successfully",
    username: profileData.username,
    // profileData,
    updatedProfile,
    profiles: allProfiles?.profiles,
    primaryProfile: allProfiles?.primaryProfile,
  });
};

// Changer le profil actif
export const switchProfile = async (req, reply) => {
  const { profileId } = req.params;
  const result = await ProfilesService.switchProfile(profileId);
  if (!result) {
    return reply.status(400).send({ message: "Failed to switch profile" });
  }
  reply.send({
    message: "Profile switched successfully",
    activeProfile: result,
  });
};

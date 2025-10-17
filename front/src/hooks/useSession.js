// src/hooks/useSession.js

import { useState, useEffect } from "react";
import { refreshAccessToken as refreshAccessTokenRequest } from "@/api/auth";
import Config from "@config";

const SESSION_KEY = "auth_session";

const sessionKeys = {
  CURRENT_PROFILE_INDEX: "currentProfileIndex",
  PRIMARY_PROFILE: "primaryProfile",
  PROFILES: "profiles",
};

let sessionCache = null;
let setSessionState = null;

/**
 *
 * @returns {object}
 * {
 * session: object|null,
 * clearSession: function,
 * setInSession: function,
 * user: object|null,
 * currentProfile: object|null,
 * sessionKeys: object,
 * primaryProfile: object|null,
 * profiles: array
 * }
 */
export const useSession = () => {
  const [session, setSession] = useState(getSession());

  useEffect(() => {
    initSession();
  }, []);

  useEffect(() => {
    /** ------------------ cmt 832886 ------------------
    console.log('=== session === useSession.js === key: 662993 ===');
    console.dir(session, { depth: null, colors: true })
    console.log('=================================');
    *-------------------------------------------------*/
  }, [session]);

  setSessionState = setSession;

  return {
    session,
    clearSession,
    setInSession,
    user: getWrapper.user,
    currentProfile: getWrapper.currentProfile,
    sessionKeys,
    primaryProfile: getWrapper.primaryProfile,
    profiles: getWrapper.profiles,
    refreshSession,
    getSession,
  };
};

const getWrapper = {
  get currentProfile() {
    return getCurrentProfile();
  },
  get user() {
    return getUser();
  },
  get primaryProfile() {
    return getPrimaryProfile();
  },
  get profiles() {
    return getProfiles();
  },
};

const getProfiles = () => {
  if (!sessionCache?.user?.profiles) {
    return [];
  }
  return sessionCache.user.profiles || [];
};

const getPrimaryProfile = () => {
  if (!sessionCache?.user?.primaryProfile) {
    return null;
  }
  return sessionCache.user.primaryProfile || null;
};

const getUser = () => {
  if (!sessionCache?.user) {
    return null;
  }
  return sessionCache.user;
};

const getCurrentProfile = () => {
  if (!sessionCache?.user?.profiles) {
    return null;
  }
  const currentProfileIndex =
    sessionCache.user[sessionKeys.CURRENT_PROFILE_INDEX];
  return sessionCache.user.profiles[currentProfileIndex] || null;
};

/**
 * Récupère la session stockée dans le localStorage.
 * @returns {object|null}
 */
/** ------------------ cmt 453246 ------------------
export const getSession = () => {
  if (sessionCache) {
    return sessionCache;
  }
  const sessionStr = localStorage.getItem(SESSION_KEY);
  sessionCache = sessionStr ? JSON.parse(sessionStr) : null;
  return sessionCache;
};
*-------------------------------------------------*/

const initSession = () => {
  if(sessionCache){
    return sessionCache;
  }
  const initialSession = getSession();
  try {
    setSessionState(initialSession);
  } catch (error) {
    console.log("=== error === useSession.js === key: 587484 ===");
    console.dir(error, { depth: null, colors: true });
    console.log("=================================");
  }
}

export const getSession = (forceRefresh = false) => {
  if (sessionCache && !forceRefresh) {
    return sessionCache;
  }

  // Sinon, charger depuis le localStorage
  const sessionStr = localStorage.getItem(SESSION_KEY);
  sessionCache = sessionStr ? JSON.parse(sessionStr) : null;
 
  return sessionCache;
};

/**
 * Rafraîchit l'accessToken en appelant le service de refresh.
 * En cas de succès, la session est mise à jour.
 * En cas d'erreur, la session est effacée.
 * @returns {Promise<object>} La nouvelle session
 */
export const refreshSession = async () => {
  //const session = getSession();
  if (!sessionCache || !sessionCache.refreshToken) {
    //throw new Error("Aucun refresh token disponible");
    return null;
  }

  const result = await refreshAccessTokenRequest(
    sessionCache.refreshToken + ""
  );

  console.log("=== result === useSession.js === key: 170648 ===");
  console.dir(result, { depth: null, colors: true });
  console.log("=================================");

  if (result?.success === false || result?.data?.success === false || !result) {
    clearSession();
    return null;
  }

  // Mise à jour de la session tout en conservant l'objet "user"
  const newSession = sessionCache;
  newSession.accessToken = result.accessToken;
  newSession.refreshToken = result.refreshToken;

  
  sessionCache = newSession;

  try {
    setSessionState(newSession);
  } catch (error) {
    console.log('=== error === useSession.js === key: 985265 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
  }

  return newSession;
};

/**
 * Stocke la session dans le localStorage.
 * @param {object} session
 */
export const setSession = (session) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  try {
    setSessionState(session);
  } catch (error) {
    console.log('=== error === useSession.js === key: 592977 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
  }
  return getSession(true);
};

const setInSession = (key, value) => {
  if (!sessionCache?.user) {
    return;
  }

  if (!Object.values(sessionKeys).includes(key)) {
    return;
  }

  if (sessionCache.user[key] === value) {
    return;
  }

  sessionCache.user[key] = value;
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionCache));
  try {
    setSessionState(getSession(true));  
  } catch (error) {
    console.log('=== error === useSession.js === key: 598872 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
  }
  return getSession(true);
  //sessionCache = {...sessionCache};
};

/**
 * Supprime la session du localStorage.
 */
export const clearSession = () => {
  sessionCache = null;
  localStorage.removeItem(SESSION_KEY);
  try {
    setSessionState(getSession()); 
  } catch (error) {
    console.log('=== error === useSession.js === key: 831542 ===');
    console.dir(error, { depth: null, colors: true })
    console.log('=================================');
  }
  return getSession();
};

import crypto from 'crypto';

export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

export const generateReferralCode = (name) => {
  const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${cleanName.substring(0, 6)}${randomSuffix}`;
};

export const formatFollowers = (count) => {
  if (typeof count !== 'number') return count;
  
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 100000) {
    return `${(count / 100000).toFixed(0)}L`;
  }
  if (count >= 10000) {
    return `${(count / 1000).toFixed(0)}K`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

export const validateInstagramHandle = (handle) => {
  const cleanHandle = handle.replace('@', '').trim();
  const regex = /^(?=[a-zA-Z0-9_.]{1,30}$)(?!.*\.$)[a-zA-Z0-9][a-zA-Z0-9_.]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/;
  return regex.test(cleanHandle);
};

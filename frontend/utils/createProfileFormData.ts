// utils/createProfileFormData.ts
export const createProfileFormData = (onboardingData: any, userId: string) => {
  const formData = new FormData();

  formData.append("user", userId);

  // Only append defined text fields so the server never receives the string "undefined"
  if (onboardingData.firstName) formData.append("firstName", onboardingData.firstName);
  if (onboardingData.lastName)  formData.append("lastName",  onboardingData.lastName);
  if (onboardingData.gender)    formData.append("gender",    onboardingData.gender);
  if (onboardingData.dateOfBirth) formData.append("dateOfBirth", onboardingData.dateOfBirth);
  if (onboardingData.skill_level) formData.append("skill_level", onboardingData.skill_level);
  if (onboardingData.bio)       formData.append("bio", onboardingData.bio);

  // Interests
  const interests: string[] = Array.isArray(onboardingData.interests)
    ? onboardingData.interests
    : onboardingData.interests
    ? [onboardingData.interests]
    : [];

  interests.forEach((interest) => {
    formData.append("interests", interest);
  });

  // Optional gyms
  (onboardingData.favoriteGyms || []).forEach((gym: string) => {
    formData.append("favoriteGyms", gym);
  });

  // Optional location
  if (onboardingData.location) {
    formData.append("location", JSON.stringify(onboardingData.location));
  }

  // Image files — guard against undefined imageUrl
  (onboardingData.imageUrl || []).forEach((uri: string, index: number) => {
    formData.append("image", {
      uri,
      type: "image/jpeg",
      name: `photo_${index}.jpg`,
    } as any);
  });

  return formData;
};

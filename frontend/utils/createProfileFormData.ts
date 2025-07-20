// utils/createProfileFormData.ts
export const createProfileFormData = (onboardingData: any, userId: string) => {
  const formData = new FormData();

  // Append text fields
  formData.append("user", userId);
  formData.append("firstName", onboardingData.firstName);
  formData.append("lastName", onboardingData.lastName);
  formData.append("gender", onboardingData.gender);
  formData.append("dateOfBirth", onboardingData.dateOfBirth);
  formData.append("skill_level", onboardingData.skill_level);
  formData.append("bio", onboardingData.bio || "");

 // Append interests
  const interests = Array.isArray(onboardingData.interests)
    ? onboardingData.interests
    : [onboardingData.interests];

  interests.forEach((interest: string) => {
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


  // Append image files
  onboardingData.imageUrl.forEach((uri: string, index: number) => {
  formData.append("image", {
    uri,
    type: "image/jpeg", 
    name: `photo_${index}.jpg`,
  } as any); 
});


  return formData;
};

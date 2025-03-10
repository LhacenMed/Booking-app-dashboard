import { Cloudinary } from "@cloudinary/url-gen";
import { auto } from "@cloudinary/url-gen/actions/resize";
import { autoGravity } from "@cloudinary/url-gen/qualifiers/gravity";

// Initialize Cloudinary instance with your cloud name
export const cld = new Cloudinary({
  cloud: {
    cloudName: "dwctkor2s",
  },
});

// Function to optimize image transformation
export const optimizeImage = (publicId: string) => {
  return cld
    .image(publicId)
    .format("auto")
    .quality("auto")
    .resize(auto().gravity(autoGravity()).width(500).height(500));
};

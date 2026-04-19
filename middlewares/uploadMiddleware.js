import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// File filter (allow only images)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

// Profile Image Storage
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "StarzoMobiles/profile",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    public_id: (req, file) => `profile-${Date.now()}`
  }
});

export const uploadProfileImage = multer({
  storage: profileStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});

// Category Icon Storage
const categoryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "StarzoMobiles/categories",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "svg"],
    public_id: (req, file) => `cat-${Date.now()}`
  }
});

export const uploadCategoryIcon = multer({
  storage: categoryStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1 * 1024 * 1024 // 1MB
  }
});

// Product Image Storage
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "StarzoMobiles/products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    public_id: (req, file) => `prod-${Date.now()}-${Math.round(Math.random() * 1e9)}`
  }
});

export const uploadProductImage = multer({
  storage: productStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB per file
  }
});


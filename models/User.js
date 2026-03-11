
import mongoose from "mongoose";

// address subdocument schema
const addressSchema = new mongoose.Schema({
  type: { type: String, enum: ['Home','Work','Other'], default: 'Home' },
  name: String,
  phone: String,
  addr1: String,
  addr2: String,
  city: String,
  state: String,
  zip: String,
  country: String,
  default: { type: Boolean, default: false }
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: { type: String },
  displayName: { type: String },
  gender: { type: String, enum: ['male','female','other','prefer_not'] },
  bio: { type: String },
  location: { type: String },
  website: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  dob: { type: Date },
  avatar: { type: String },
  addresses: [addressSchema],
  isGoogleUser: { type: Boolean, default: false },
  profileImage: {
     type: String,
     default: "/images/default-avatar.png"
  },

  isVerified: {
        type: Boolean,
        default: false
    },

  otp: String,
  otpExpiry: Date,
  status: {
    type: Number,
    default: 1
  },
  // Keep this for compatibility with older code paths and existing records.
  isBlocked: {
    type: Boolean,
    default: false
  }
  
},{ timestamps: true });

export default mongoose.model("User", userSchema);

import mongoose from 'mongoose';

// Define the structure of a Project document in MongoDB
const projectSchema = new mongoose.Schema(
  {
    // The project's title — required and cannot be blank
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },

    // Optional description of the project
    description: {
      type: String,
      trim: true,
      default: '',
    },

    // The owner field stores a reference to the User who created this project.
    // mongoose.Schema.Types.ObjectId is MongoDB's unique ID type.
    // ref: 'User' tells Mongoose which model this ID belongs to,
    // which allows us to use .populate() later to fetch full user details.
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields to every document
    timestamps: true,
  }
);

const Project = mongoose.model('Project', projectSchema);

export default Project;

import mongoose from "mongoose";

const connectDataBase = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`connected to ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    // terminate the process
    process.exit(1);
  }
};

export default connectDataBase;

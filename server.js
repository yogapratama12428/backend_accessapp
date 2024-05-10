import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const app = express();

const prisma = new PrismaClient();

dotenv.config();

app.use(express.json());
app.use(cors());

app.get("/", async (req, res) => {
  res.send("Hello World!");
});

app.get("/api/v1/penghuni", async (req, res) => {
  try {
    const pengunjung = await prisma.penghuni.findMany({
      include: {
        pengunjung: true,
      },
    });

    res.status(200).json(pengunjung);
  } catch (error) {
    res.status(404).json({ error: error });
  }
});

app.post("/api/v1/pengunjung", async (req, res) => {
  const { name, penghuniId } = req.body;

  try {
    const pengunjung = await prisma.pengunjung.create({
      data: {
        name,
        status: "memanggil",
        penghuniId,
      },
    });

    res.status(200).json(pengunjung);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "some error occurred",
    });
  }
});

// MOBILE ROUTE

app.post("/api/v2/register", async (req, res) => {
  const { email, name, password, alamat } = req.body;

  try {
    const salt = bcrypt.genSaltSync(10);

    const hashedPassword = await bcrypt.hashSync(password, salt);

    await prisma.penghuni.create({
      data: {
        email,
        name,
        alamat,
        password: hashedPassword,
      },
    });

    res.status(200).json({
      message: "User created successfully",
    });
  } catch (error) {
    res.status(401).json(error);
  }
});

app.post("/api/v2/sign-in", async (req, res) => {
  const { email, password } = req.body;

  try {
    const isValidEmail = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!isValidEmail) {
      return res.status(401).json({
        message: "Invalid email",
      });
    }

    const isValidPassword = bcrypt.compareSync(password, isValidEmail.password);

    if (!isValidPassword) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }

    res.status(200).json({
      message: "Logged in successfully",
    });
  } catch (error) {
    res.status(401).json(error);
  }
});

app.get("/api/v2/pengunjung", async (req, res) => {
  try {
    const pengunjung = await prisma.pengunjung.findMany({});

    res.status(200).json(pengunjung);
  } catch (error) {
    res.status(404).json({ error: error });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Example app listening at http://localhost:${process.env.PORT}`);
});

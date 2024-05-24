import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const app = express();

const prisma = new PrismaClient();

dotenv.config();

app.use(express.json());
app.use(cors());

app.get("/", async (req, res) => {
  res.send("Hello World!");
});

// WEB ROUTE

app.get("/api/v1/penghuni", async (req, res) => {
  try {
    const penghuni = await prisma.penghuni.findMany({
      include: {
        pengunjung: true,
      },
    });

    res.status(200).json(penghuni);
  } catch (error) {
    res.status(404).json({ error: error });
  }
});

app.get("/api/v1/pengunjung/:id", async (req, res) => {
  try {
    const penghuni = await prisma.pengunjung.findUnique({
      where: {
        id: req.params.id,
      },
    });

    res.status(200).json(penghuni);
  } catch (error) {
    res.status(404).json({ error: error });
  }
});

// status --> [memanggil, akses diterima, akses ditolak]
app.post("/api/v1/pengunjung", async (req, res) => {
  const { name, penghuniId, kepentingan, status, isCalled, isOut } = req.body;

  try {
    const pengunjung = await prisma.pengunjung.create({
      data: {
        name,
        status,
        kepentingan,
        penghuniId,
        isCalled,
        isOut,
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

// EDIT USER
app.put("/api/v1/user/:id", async (req, res) => {
  const { isVeryfied, isAdmin } = req.body;
  const { id } = req.params;

  try {
    const isDuplicateAlamat = await prisma.penghuni.findUnique({
      where: {
        alamat,
      },
    });

    if (isDuplicateAlamat) {
      return res.status(400).json({
        message: "Alamat sudah terdaftar",
      });
    }

    const response = await prisma.penghuni.update({
      where: {
        id,
      },
      data: {
        isAdmin,
        isVeryfied,
      },
    });

    res.status(201).json(response);
  } catch (error) {
    res.status(401).json(error);
  }
});

// DELETE USER
app.delete("/api/v1/user/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.penghuni.delete({
      where: {
        id,
      },
      include: {
        pengunjung: true,
      },
    });
    res.status(201).json({ msg: "berhasil dihapus" });
  } catch (error) {
    res.status(401).json(error);
  }
});

// GENERAL ROUTE REGISTER - LOGIN- LOGOUT
app.post("/api/v2/register", async (req, res) => {
  const { email, name, password, alamat, isOut, isAdmin, isVeryfied } =
    req.body;

  try {
    const isDuplicateEmail = await prisma.penghuni.findUnique({
      where: {
        email,
      },
    });

    if (isDuplicateEmail) {
      return res.status(400).json({
        message: "Email sudah terdaftar",
        error: 1,
      });
    }

    const isDuplicateAlamat = await prisma.penghuni.findUnique({
      where: {
        alamat,
      },
    });

    if (isDuplicateAlamat) {
      return res.status(400).json({
        message: "Alamat sudah terdaftar",
        error: 1,
      });
    }

    const salt = bcrypt.genSaltSync(10);

    const hashedPassword = await bcrypt.hashSync(password, salt);

    const accessToken = jwt.sign(
      {
        email,
      },
      "ACCESSTOKEN",
      {
        expiresIn: "1d",
      }
    );

    await prisma.penghuni.create({
      data: {
        email,
        name,
        alamat,
        password: hashedPassword,
        isAdmin,
        isVeryfied,
        accessToken: accessToken,
      },
    });

    res.status(200).json({
      message: "User created successfully",
      error: 0,
    });
  } catch (error) {
    res.status(401).json({
      message: "some error occurred",
      error: 1,
    });
  }
});

app.post("/api/v2/sign-in", async (req, res) => {
  const { email, password } = req.body;

  try {
    const isValidEmail = await prisma.penghuni.findUnique({
      where: {
        email,
      },
    });

    if (!isValidEmail) {
      return res.status(401).json({
        message: "Invalid email",
        error: 1,
      });
    }

    const isValidPassword = bcrypt.compareSync(password, isValidEmail.password);

    if (!isValidPassword) {
      return res.status(401).json({
        message: "Invalid password",
        error: 1,
      });
    }

    const accessToken = jwt.sign(
      {
        email,
      },
      "ACCESSTOKEN",
      {
        expiresIn: "1d",
      }
    );

    await prisma.penghuni.update({
      where: {
        email,
      },
      data: {
        accessToken: accessToken,
      },
    });

    res.status(200).json({
      message: "Logged in successfully",
      token: accessToken,
      id: isValidEmail.id,
      isAdmin: isValidEmail.isAdmin,
      error: 0,
    });
  } catch (error) {
    res.status(401).json({
      message: "Some Occurred Error",
      error: 1,
    });
  }
});

app.delete("/api/v2/sign-out", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.penghuni.update({
      where: {
        id,
      },
      data: {
        accessToken: null,
      },
    });

    res.status(200).json({
      message: "Logged out successfully",
      error: 0,
    });
  } catch (error) {
    res.status(401).json({
      message: "Some Occurred Error",
      error: 1,
    });
  }
});

//MOBILE ROUTE
app.get("/api/v2/pengunjung", async (req, res) => {
  try {
    const pengunjung = await prisma.pengunjung.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    res.status(200).json(pengunjung);
  } catch (error) {
    res.status(404).json({ error: error });
  }
});

app.get("/api/v2/penghuni/:id", async (req, res) => {
  try {
    const penghuni = await prisma.penghuni.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        pengunjung: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    res.status(200).json(penghuni);
  } catch (error) {
    res.status(404).json({ error: error });
  }
});

//route --> panggilan
app.get("/api/v2/panggil/pengunjung/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const panggil = await prisma.pengunjung.findFirst({
      where: {
        isCalled: true,
        penghuniId: id,
      },
    });

    res.status(200).json(panggil);
  } catch (error) {
    res.status(404).json({ error: error });
  }
});

app.put("/api/v2/pengunjung/:id", async (req, res) => {
  const { status, isCalled } = req.body;

  try {
    const pengunjung = await prisma.pengunjung.update({
      where: {
        id: req.params.id,
      },
      data: {
        isCalled,
        status,
      },
    });

    res.status(200).json(pengunjung);
  } catch (error) {
    res.status(404).json({ error: error });
  }
});

app.get("/api/v2/penghuni", async (req, res) => {
  try {
    const penghuni = await prisma.penghuni.findMany({});

    res.status(200).json({
      penghuni: penghuni,
    });
  } catch (error) {
    res.status(404).json({ error: error });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Example app listening at http://localhost:${process.env.PORT}`);
});

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client';

const app = express();

const prisma = new PrismaClient();

dotenv.config();

app.use(cors());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post('/api/v1/register', async (req, res) => {

    const { email, name, password, alamat } = req.body;

    try {

        const salt = bcrypt.genSaltSync(10)

        const hashedPassword = bcrypt.hashSync(password, salt)

        const response = await prisma.user.create({
            data: {
                email,
                name,
                alamat,
                password: hashedPassword
            }
        })

        res.status(200).json({
            message: 'User created successfully'
        });

    } catch (error) {
        res.status(401).json(error);
    }
})

app.post('/api/v1/sign-in', async (req, res) => {

    const { email, password } = req.body;

    try {
        const isValidEmail = await prisma.user.findUnique({
            where: {
                email
            }
        })

        if (!isValidEmail) {
            return res.status(401).json({
                message: 'Invalid email'
            })
        }

        const isValidPassword = bcrypt.compareSync(password, isValidEmail.password)

        if (!isValidPassword) {
            return res.status(401).json({
                message: 'Invalid password'
            })
        }

        res.status(200).json({
            message: 'Logged in successfully'
        });

    } catch (error) {
        res.status(401).json(error);
    }
})


app.post('/api/v2/pengunjung', async (req, res) => {
    const { nama, jenis_kelamin, alamat } = req.body;
    try {
        const response = await prisma.pengunjung.create({
            data: {
                nama,
                jenis_kelamin,
                alamat
            }
        })
        res.status(200).json({
            message: 'Pengunjung created successfully'
        });
    } catch (error) {
        res.status(401).json(error);
    }
})

app.listen(process.env.PORT, () => {
    console.log(`Example app listening at http://localhost:${process.env.PORT}`);
});
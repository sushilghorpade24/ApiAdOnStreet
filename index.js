
const express = require("express");
const app = express();
const port = 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for HTML forms
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_SECRET = "mySuperSecretKey";
const auth = require("./middleware/auth"); 

const db = require("./db");
app.get("/", (req, res) => {
  res.redirect("/api-docs");
});
// Swagger Setup
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "AdOnStreet Project API",
            version: "1.0.0",
            description: "API to manage vehicle marketing records",
        },
    },
    apis: ["./index.js"], // 👈 Swagger will scan this file
};
const specs = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.get("/", (req, res) => res.send("Welcome to Vehicle Marketing API"));
const cors = require("cors");

app.use(cors({
    origin: ["http://localhost:4200","http://localhost:5173"], // Angular dev server
    methods: ["GET", "POST", "PUT", "DELETE"]
}));


/**
* @swagger
* components:
*   schemas:
*     VehicleMarketing:
*       type: object
*       properties:
*         v_id:
*           type: integer
*         v_type:
*           type: string
*           example: Car
*         v_number:
*           type: string
*           example: MH12AB1234
*         v_area:
*           type: string
*           example: MG Road
*         v_city:
*           type: string
*           example: Pune
*         v_start_date:
*           type: string
*           format: date
*           example: 2025-09-10
*         v_end_date:
*           type: string
*           format: date
*           example: 2025-09-20
*         v_duration_days:
*           type: integer
*           example: 10
*         expected_crowd:
*           type: integer
*           example: 5000
*         v_contact_person_name:
*           type: string
*           example: Rajesh Kumar
*         v_contact_num:
*           type: string
*           example: 9876543210
*         v_cost:
*           type: number
*           format: float
*           example: 15000.00
*         payment_status:
*           type: string
*           example: Paid
*         remarks:
*           type: string
*           example: Promo campaign near malls
*         created_at:
*           type: string
*           format: date-time
*/

// ---------------- CRUD APIs ----------------

/**
* @swagger
* /vehicles:
*   get:
*     summary: Get all vehicle marketing records
*     tags: [VehicleMarketing]
*     responses:
*       200:
*         description: List of vehicles
*/
app.get("/vehicles",(req, res) => {
    db.query("SELECT * FROM vehicle_marketing", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

/**
* @swagger
* /vehicles/{id}:
*   get:
*     summary: Get a vehicle by ID
*     tags: [VehicleMarketing]
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema:
*           type: integer
*     responses:
*       200:
*         description: Vehicle record
*/
app.get("/vehicles/:id", (req, res) => {
    const { id } = req.params;
    db.query("SELECT * FROM vehicle_marketing WHERE v_id = ?", [id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).send("Record not found");
        res.json(results[0]);
    });
});

/**
* @swagger
* /vehicles:
*   post:
*     summary: Create a new vehicle marketing record
*     tags: [VehicleMarketing]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/VehicleMarketing'
*     responses:
*       201:
*         description: Vehicle created
*/
app.post("/vehicles", (req, res) => {
    const data = req.body;
    const sql = `
            INSERT INTO vehicle_marketing 
            (v_type, v_number, v_area, v_city, v_start_date, v_end_date, v_duration_days, expected_crowd, v_contact_person_name, v_contact_num, v_cost, payment_status, remarks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
    const values = [
        data.v_type,
        data.v_number,
        data.v_area,
        data.v_city,
        data.v_start_date,
        data.v_end_date,
        data.v_duration_days,
        data.expected_crowd,
        data.v_contact_person_name,
        data.v_contact_num,
        data.v_cost,
        data.payment_status,
        data.remarks,
    ];

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).send(err);
        res.status(201).send({ message: "Vehicle created", id: result.insertId });
    });
});

/**
* @swagger
* /vehicles/{id}:
*   put:
*     summary: Update a vehicle record
*     tags: [VehicleMarketing]
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema:
*           type: integer
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/VehicleMarketing'
*     responses:
*       200:
*         description: Vehicle updated
*/
app.put("/vehicles/:id", (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const sql = `
            UPDATE vehicle_marketing SET 
            v_type=?, v_number=?, v_area=?, v_city=?, v_start_date=?, v_end_date=?, v_duration_days=?, expected_crowd=?, 
            v_contact_person_name=?, v_contact_num=?, v_cost=?, payment_status=?, remarks=?
            WHERE v_id=?
        `;
    const values = [
        data.v_type,
        data.v_number,
        data.v_area,
        data.v_city,
        data.v_start_date,
        data.v_end_date,
        data.v_duration_days,
        data.expected_crowd,
        data.v_contact_person_name,
        data.v_contact_num,
        data.v_cost,
        data.payment_status,
        data.remarks,
        id,
    ];

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).send(err);
        res.send({ message: "Vehicle updated" });
    });
});

/**
* @swagger
* /vehicles/{id}:
*   delete:
*     summary: Delete a vehicle record
*     tags: [VehicleMarketing]
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema:
*           type: integer
*     responses:
*       200:
*         description: Vehicle deleted
*/
app.delete("/vehicles/:id", (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM vehicle_marketing WHERE v_id = ?", [id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send({ message: "Vehicle deleted" });
    });
});


/* ============================================================
Society Marketing APIs
============================================================ */

/**
* @swagger
* components:
*   schemas:
*     SocietyMarketing:
*       type: object
*       properties:
*         s_id:
*           type: integer
*         s_name:
*           type: string
*           example: Green Valley Apartments
*         s_area:
*           type: string
*           example: MG Road
*         s_city:
*           type: string
*           example: Pune
*         s_pincode:
*           type: string
*           example: 411001
*         s_contact_person_name:
*           type: string
*           example: Ramesh Sharma
*         s_contact_num:
*           type: string
*           example: 9876543210
*         s_no_flats:
*           type: integer
*           example: 120
*         s_type:
*           type: string
*           enum: [Residential, Commercial]
*         s_event_type:
*           type: string
*           example: Ganesh Festival Campaign
*         event_date:
*           type: string
*           format: date
*           example: 2025-09-15
*         event_time:
*           type: string
*           format: time
*           example: 18:00:00
*         s_address:
*           type: string
*           example: MG Road, Pune
*         s_lat:
*           type: number
*           format: float
*         s_long:
*           type: number
*           format: float
*         s_crowd:
*           type: integer
*         approval_status:
*           type: string
*           example: Approved
*         event_status:
*           type: string
*           example: Scheduled
*         expected_cost:
*           type: number
*           format: float
*         actual_cost:
*           type: number
*           format: float
*         responsible_person:
*           type: string
*           example: Anita Deshmukh
*         follow_up_date:
*           type: string
*           format: date
*         remarks:
*           type: string
*           example: Target families during festival
*         created_at:
*           type: string
*           format: date-time
*         updated_at:
*           type: string
*           format: date-time
*/

// ---------------- CRUD APIs for Society Marketing ----------------

/**
* @swagger
* /societies:
*   get:
*     summary: Get all society marketing records
*     tags: [SocietyMarketing]
*     responses:
*       200:
*         description: List of societies
*/
app.get("/societies", (req, res) => {
    db.query("SELECT * FROM society_marketing", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

/**
* @swagger
* /societies/{id}:
*   get:
*     summary: Get a society record by ID
*     tags: [SocietyMarketing]
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema:
*           type: integer
*     responses:
*       200:
*         description: Society record
*/
app.get("/societies/:id", (req, res) => {
    const { id } = req.params;
    db.query("SELECT * FROM society_marketing WHERE s_id = ?", [id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).send("Record not found");
        res.json(results[0]);
    });
});

/**
* @swagger
* /societies:
*   post:
*     summary: Create a new society marketing record
*     tags: [SocietyMarketing]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/SocietyMarketing'
*     responses:
*       201:
*         description: Society created
*/
app.post("/societies", (req, res) => {
    const data = req.body;
    const sql = `
            INSERT INTO society_marketing
            (s_name, s_area, s_city, s_pincode, s_contact_person_name, s_contact_num, s_no_flats, s_type, s_event_type, event_date, event_time, s_address, s_lat, s_long, s_crowd, approval_status, event_status, expected_cost, actual_cost, responsible_person, follow_up_date, remarks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
    const values = [
        data.s_name,
        data.s_area,
        data.s_city,
        data.s_pincode,
        data.s_contact_person_name,
        data.s_contact_num,
        data.s_no_flats,
        data.s_type,
        data.s_event_type,
        data.event_date,
        data.event_time,
        data.s_address,
        data.s_lat,
        data.s_long,
        data.s_crowd,
        data.approval_status,
        data.event_status,
        data.expected_cost,
        data.actual_cost,
        data.responsible_person,
        data.follow_up_date,
        data.remarks,
    ];

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).send(err);
        res.status(201).send({ message: "Society created", id: result.insertId });
    });
});

/**
* @swagger
* /societies/{id}:
*   put:
*     summary: Update a society record
*     tags: [SocietyMarketing]
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema:
*           type: integer
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/SocietyMarketing'
*     responses:
*       200:
*         description: Society updated
*/
app.put("/societies/:id", (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const sql = `
            UPDATE society_marketing SET
            s_name=?, s_area=?, s_city=?, s_pincode=?, s_contact_person_name=?, s_contact_num=?, s_no_flats=?, s_type=?, 
            s_event_type=?, event_date=?, event_time=?, s_address=?, s_lat=?, s_long=?, s_crowd=?, 
            approval_status=?, event_status=?, expected_cost=?, actual_cost=?, responsible_person=?, follow_up_date=?, remarks=?
            WHERE s_id=?
        `;
    const values = [
        data.s_name,
        data.s_area,
        data.s_city,
        data.s_pincode,
        data.s_contact_person_name,
        data.s_contact_num,
        data.s_no_flats,
        data.s_type,
        data.s_event_type,
        data.event_date,
        data.event_time,
        data.s_address,
        data.s_lat,
        data.s_long,
        data.s_crowd,
        data.approval_status,
        data.event_status,
        data.expected_cost,
        data.actual_cost,
        data.responsible_person,
        data.follow_up_date,
        data.remarks,
        id,
    ];

    db.query(sql, values, (err) => {
        if (err) return res.status(500).send(err);
        res.send({ message: "Society updated" });
    });
});

/**
* @swagger
* /societies/{id}:
*   delete:
*     summary: Delete a society record
*     tags: [SocietyMarketing]
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema:
*           type: integer
*     responses:
*       200:
*         description: Society deleted
*/
app.delete("/societies/:id", (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM society_marketing WHERE s_id = ?", [id], (err) => {
        if (err) return res.status(500).send(err);
        res.send({ message: "Society deleted" });
    });
});

/* ============================================================
Balloon Marketing APIs
============================================================ */

/**
* @swagger
* components:
*   schemas:
*     BalloonMarketing:
*       type: object
*       properties:
*         b_id:
*           type: integer
*         b_location_name:
*           type: string
*           example: Central Mall
*         b_area:
*           type: string
*           example: FC Road
*         b_city:
*           type: string
*           example: Pune
*         b_address:
*           type: string
*           example: FC Road, Pune, Maharashtra
*         b_lat:
*           type: number
*           format: float
*         b_long:
*           type: number
*           format: float
*         b_size:
*           type: string
*           example: Large
*         b_type:
*           type: string
*           enum: [Sky, Helium, Inflatable]
*         b_height:
*           type: integer
*           example: 30
*         b_duration_days:
*           type: integer
*           example: 15
*         b_start_date:
*           type: string
*           format: date
*         b_end_date:
*           type: string
*           format: date
*         expected_crowd:
*           type: integer
*           example: 5000
*         b_contact_person_name:
*           type: string
*           example: Rajesh Gupta
*         b_contact_num:
*           type: string
*           example: 9876543210
*         b_cost:
*           type: number
*           format: float
*         payment_status:
*           type: string
*           example: Pending
*         remarks:
*           type: string
*           example: High visibility location
*         created_at:
*           type: string
*           format: date-time
*/

// ---------------- CRUD APIs for Balloon Marketing ----------------

/**
* @swagger
* /balloons:
*   get:
*     summary: Get all balloon marketing records
*     tags: [BalloonMarketing]
*     responses:
*       200:
*         description: List of balloons
*/
app.get("/balloons", (req, res) => {
    db.query("SELECT * FROM balloon_marketing", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

/**
* @swagger
* /balloons/{id}:
*   get:
*     summary: Get a balloon marketing record by ID
*     tags: [BalloonMarketing]
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema:
*           type: integer
*     responses:
*       200:
*         description: Balloon record
*/
app.get("/balloons/:id", (req, res) => {
    const { id } = req.params;
    db.query("SELECT * FROM balloon_marketing WHERE b_id = ?", [id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).send("Record not found");
        res.json(results[0]);
    });
});

/**
* @swagger
* /balloons:
*   post:
*     summary: Create a new balloon marketing record
*     tags: [BalloonMarketing]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/BalloonMarketing'
*     responses:
*       201:
*         description: Balloon created
*/
app.post("/balloons", (req, res) => {
    const data = req.body;
    const sql = `
            INSERT INTO balloon_marketing
            (b_location_name, b_area, b_city, b_address, b_lat, b_long, b_size, b_type, b_height, b_duration_days, b_start_date, b_end_date, expected_crowd, b_contact_person_name, b_contact_num, b_cost, payment_status, remarks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
    const values = [
        data.b_location_name,
        data.b_area,
        data.b_city,
        data.b_address,
        data.b_lat,
        data.b_long,
        data.b_size,
        data.b_type,
        data.b_height,
        data.b_duration_days,
        data.b_start_date,
        data.b_end_date,
        data.expected_crowd,
        data.b_contact_person_name,
        data.b_contact_num,
        data.b_cost,
        data.payment_status,
        data.remarks,
    ];

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).send(err);
        res.status(201).send({ message: "Balloon created", id: result.insertId });
    });
});

/**
* @swagger
* /balloons/{id}:
*   put:
*     summary: Update a balloon marketing record
*     tags: [BalloonMarketing]
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema:
*           type: integer
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/BalloonMarketing'
*     responses:
*       200:
*         description: Balloon updated
*/
app.put("/balloons/:id", (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const sql = `
            UPDATE balloon_marketing SET
            b_location_name=?, b_area=?, b_city=?, b_address=?, b_lat=?, b_long=?, b_size=?, b_type=?, 
            b_height=?, b_duration_days=?, b_start_date=?, b_end_date=?, expected_crowd=?, 
            b_contact_person_name=?, b_contact_num=?, b_cost=?, payment_status=?, remarks=?
            WHERE b_id=?
        `;
    const values = [
        data.b_location_name,
        data.b_area,
        data.b_city,
        data.b_address,
        data.b_lat,
        data.b_long,
        data.b_size,
        data.b_type,
        data.b_height,
        data.b_duration_days,
        data.b_start_date,
        data.b_end_date,
        data.expected_crowd,
        data.b_contact_person_name,
        data.b_contact_num,
        data.b_cost,
        data.payment_status,
        data.remarks,
        id,
    ];

    db.query(sql, values, (err) => {
        if (err) return res.status(500).send(err);
        res.send({ message: "Balloon updated" });
    });
});

/**
* @swagger
* /deleteballoonsbyid/{id}:
*   delete:
*     summary: Delete a balloon marketing record
*     tags: [BalloonMarketing]
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema:
*           type: integer
*     responses:
*       200:
*         description: Balloon deleted
*/
app.delete("/balloons/:id", (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM balloon_marketing WHERE b_id = ?", [id], (err) => {
        if (err) return res.status(500).send(err);
        res.send({ message: "Balloon deleted" });
    });
});
/**
* @swagger
* components:
*   schemas:
*     OutdoorMarketingScreen:
*       type: object
*       properties:
*         ScreenID:
*           type: integer
*         ScreenName:
*           type: string
*           example: Pune-MG-Road-LED01
*         Location:
*           type: string
*           example: MG Road, Near Central Mall
*         City:
*           type: string
*           example: Pune
*         State:
*           type: string
*           example: Maharashtra
*         Latitude:
*           type: number
*           format: float
*         Longitude:
*           type: number
*           format: float
*         ScreenType:
*           type: string
*           example: LED Wall
*         Size:
*           type: string
*           example: 20x10 ft
*         Resolution:
*           type: string
*           example: 1920x1080
*         OwnerName:
*           type: string
*           example: AdVision Pvt Ltd
*         ContactPerson:
*           type: string
*           example: Rajesh Gupta
*         ContactNumber:
*           type: string
*           example: 9876543210
*         OnboardingDate:
*           type: string
*           format: date
*         Status:
*           type: string
*           enum: [Active, Inactive, Maintenance, Pending]
*         RentalCost:
*           type: number
*           format: float
*         ContractStartDate:
*           type: string
*           format: date
*         ContractEndDate:
*           type: string
*           format: date
*         PowerBackup:
*           type: boolean
*         InternetConnectivity:
*           type: string
*           example: Fiber
*         Notes:
*           type: string
*           example: Prime location near mall
*/


// ---------------- CRUD APIs for Outdoor Marketing Screens ----------------

/**
* @swagger
* /screens:
*   get:
*     summary: Get all outdoor marketing screens
*     tags: [OutdoorMarketingScreen]
*     responses:
*       200:
*         description: List of screens
*/
app.get("/screens", (req, res) => {
    db.query("SELECT * FROM outdoormarketingscreens", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json({result:true,status:200,message:'Scrrent data fech Success',data:results});
    });
});

/**
* @swagger
* /screens/{id}:
*   get:
*     summary: Get a screen by ID
*     tags: [OutdoorMarketingScreen]
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema:
*           type: integer
*     responses:
*       200:
*         description: Screen record
*/
app.get("/screens/:id", (req, res) => {
    const { id } = req.params;
    db.query("SELECT * FROM outdoormarketingscreens WHERE ScreenID = ?", [id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).send("Screen not found");
        res.json({result:true,status:200,message:'screen data fetched',data:results[0]});
    });
});

/**
* @swagger
* /screens:
*   post:
*     summary: Create a new screen record
*     tags: [OutdoorMarketingScreen]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/OutdoorMarketingScreen'
*     responses:
*       201:
*         description: Screen created
*/
app.post("/screens", (req, res) => {
    const data = req.body;
    const sql = `
            INSERT INTO outdoormarketingscreens
            (ScreenName, Location, City, State, Latitude, Longitude, ScreenType, Size, Resolution, OwnerName, ContactPerson, ContactNumber, OnboardingDate, Status, RentalCost, ContractStartDate, ContractEndDate, PowerBackup, InternetConnectivity, Notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
    const values = [
        data.ScreenName,
        data.Location,
        data.City,
        data.State,
        data.Latitude,
        data.Longitude,
        data.ScreenType,
        data.Size,
        data.Resolution,
        data.OwnerName,
        data.ContactPerson,
        data.ContactNumber,
        data.OnboardingDate,
        data.Status,
        data.RentalCost,
        data.ContractStartDate,
        data.ContractEndDate,
        data.PowerBackup,
        data.InternetConnectivity,
        data.Notes,
    ];

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).send(err);
        res.status(201).send({retult:true, status:201, message: "Screen created", data:result });
    });
});

/**
* @swagger
* /screens/{id}:
*   put:
*     summary: Update a screen record
*     tags: [OutdoorMarketingScreen]
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema:
*           type: integer
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/OutdoorMarketingScreen'
*     responses:
*       200:
*         description: Screen updated
*/
app.put("/screens/:id", (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const sql = `
            UPDATE outdoormarketingscreens SET
            ScreenName=?, Location=?, City=?, State=?, Latitude=?, Longitude=?, ScreenType=?, Size=?, Resolution=?, 
            OwnerName=?, ContactPerson=?, ContactNumber=?, OnboardingDate=?, Status=?, RentalCost=?, ContractStartDate=?, 
            ContractEndDate=?, PowerBackup=?, InternetConnectivity=?, Notes=?
            WHERE ScreenID=?
        `;
    const values = [
        data.ScreenName,
        data.Location,
        data.City,
        data.State,
        data.Latitude,
        data.Longitude,
        data.ScreenType,
        data.Size,
        data.Resolution,
        data.OwnerName,
        data.ContactPerson,
        data.ContactNumber,
        data.OnboardingDate,
        data.Status,
        data.RentalCost,
        data.ContractStartDate,
        data.ContractEndDate,
        data.PowerBackup,
        data.InternetConnectivity,
        data.Notes,
        id,
    ];

    db.query(sql, values, (err,result) => {
        if (err) return res.status(500).send(err);
        res.send({result:true,status:200, message: "Screen updated" ,data:result });
    });
});

/**
* @swagger
* /screens/{id}:
*   delete:
*     summary: Delete a screen record
*     tags: [OutdoorMarketingScreen]
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema:
*           type: integer
*     responses:
*       200:
*         description: Screen deleted
*/
app.delete("/screens/:id", (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM outdoormarketingscreens WHERE ScreenID = ?", [id], (err) => {
        if (err) return res.status(500).send(err);
        res.send({result:true,status:201, message: "Screen deleted" });
    });
});

// Hoardings crud

/**
* @swagger
* components:
*   schemas:
*     Hoarding:
*       type: object
*       properties:
*         h_id:
*           type: integer
*         h_name:
*           type: string
*           example: Banner 1
*         address:
*           type: string
*           example: MG Road, Pune
*         city:
*           type: string
*           example: Pune
*         state:
*           type: string
*           example: Maharashtra
*         latitude:
*           type: number
*           format: float
*         longitude:
*           type: number
*           format: float
*         size:
*           type: string
*           example: 20x10 ft
*         owner_name:
*           type: string
*           example: AdVision Pvt Ltd
*         contact_person:
*           type: string
*           example: Rajesh Gupta
*         contact_number:
*           type: string
*           example: 9876543210
*         ad_start_date:
*           type: string
*           format: date
*         ad_end_date:
*           type: string
*           format: date
*         status:
*           type: string
*           enum: [Available, Occupied, Under Maintenance, Booked]
*         rental_cost:
*           type: number
*           format: float
*         contract_start_date:
*           type: string
*           format: date
*         contract_end_date:
*           type: string
*           format: date
*         notes:
*           type: string
*           example: Near busy junction
*         created_at:
*           type: string
*           format: date-time
*/
// ---------------- CRUD APIs for Hoardings ----------------

/**
* @swagger
* /hoardings:
*   get:
*     summary: Get all hoardings
*     tags: [Hoarding]
*     responses:
*       200:
*         description: List of hoardings
*/
app.get("/hoardings", (req, res) => {
    db.query("SELECT * FROM hoardings", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});
/**
* @swagger
* /hoardings/{id}:
*   get:
*     summary: Get a hoarding by ID
*     tags: [Hoarding]
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema:
*           type: integer
*     responses:
*       200:
*         description: Hoarding record
*/
app.get("/hoardings/:id", (req, res) => {
    const { id } = req.params;
    db.query("SELECT * FROM hoardings WHERE h_id = ?", [id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).send("Hoarding not found");
        res.json(results[0]);
    });
});

/**
* @swagger
* /hoardings:
*   post:
*     summary: Create a new hoarding
*     tags: [Hoarding]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/Hoarding'
*     responses:
*       201:
*         description: Hoarding created
*/
app.post("/hoardings", (req, res) => {
    const data = req.body;
    const sql = `
        INSERT INTO hoardings
        (h_name, address, city, state, latitude, longitude, size, owner_name, contact_person, contact_number, ad_start_date, ad_end_date, status, rental_cost, contract_start_date, contract_end_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        data.h_name,
        data.address,
        data.city,
        data.state,
        data.latitude,
        data.longitude,
        data.size,
        data.owner_name,
        data.contact_person,
        data.contact_number,
        data.ad_start_date,
        data.ad_end_date,
        data.status,
        data.rental_cost,
        data.contract_start_date,
        data.contract_end_date,
        data.notes
    ];

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).send(err);
        res.status(201).send({ message: "Hoarding created", id: result.insertId });
    });
});
/**
* @swagger
* /hoardings/{id}:
*   put:
*     summary: Update a hoarding
*     tags: [Hoarding]
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema:
*           type: integer
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/Hoarding'
*     responses:
*       200:
*         description: Hoarding updated
*/
app.put("/hoardings/:id", (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const sql = `
        UPDATE hoardings SET
        h_name=?, address=?, city=?, state=?, latitude=?, longitude=?, size=?, owner_name=?, contact_person=?, contact_number=?, ad_start_date=?, ad_end_date=?, status=?, rental_cost=?, contract_start_date=?, contract_end_date=?, notes=?
        WHERE h_id=?
    `;
    const values = [
        data.h_name,
        data.address,
        data.city,
        data.state,
        data.latitude,
        data.longitude,
        data.size,
        data.owner_name,
        data.contact_person,
        data.contact_number,
        data.ad_start_date,
        data.ad_end_date,
        data.status,
        data.rental_cost,
        data.contract_start_date,
        data.contract_end_date,
        data.notes,
       
        id,
    ];

    db.query(sql, values, (err) => {
        if (err) return res.status(500).send(err);
        res.send({ message: "Hoarding updated" });
    });
});

/**
* @swagger
* /hoardings/{id}:
*   delete:
*     summary: Delete a hoarding
*     tags: [Hoarding]
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema:
*           type: integer
*     responses:
*       200:
*         description: Hoarding deleted
*/
app.delete("/hoardings/:id", (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM hoardings WHERE h_id = ?", [id], (err) => {
        if (err) return res.status(500).send(err);
        res.send({ message: "Hoarding deleted" });
    });
});
/**
* @swagger
* /dashboard/counts:
*   get:
*     summary: Get counts of all marketing entities
*     tags: [Dashboard]
*     responses:
*       200:
*         description: Counts of all tables
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 vehicles:
*                   type: integer
*                   example: 20
*                 societies:
*                   type: integer
*                   example: 15
*                 balloons:
*                   type: integer
*                   example: 8
*                 screens:
*                   type: integer
*                   example: 12
*                 hoardings:
*                   type: integer
*                   example: 25
*/
app.get("/dashboard/counts", (req, res) => {
    const queries = {
        vehicles: "SELECT COUNT(*) AS count FROM vehicle_marketing",
        societies: "SELECT COUNT(*) AS count FROM society_marketing",
        balloons: "SELECT COUNT(*) AS count FROM balloon_marketing",
        screens: "SELECT COUNT(*) AS count FROM outdoormarketingscreens",
        hoardings: "SELECT COUNT(*) AS count FROM hoardings"
    };

    let results = {};
    let completed = 0;
    let total = Object.keys(queries).length;

    Object.entries(queries).forEach(([key, sql]) => {
        db.query(sql, (err, rows) => {
            if (err) return res.status(500).send(err);

            results[key] = rows[0].count;
            completed++;

            if (completed === total) {
                res.json(results);
            }
        });
    });
});
// ==================Users Crud Schema ====================
/**
* @swagger
* components:
*   schemas:
*     Users:
*       type: object
*       properties:
*         userId:
*           type: integer
*         userName:
*           type: string
*           example: danny
*         emailId:
*           type: string
*           example: danny@gmail.com
*         password:
*           type: string
*           example: danny@123
*/
// ===============Now User Api Below==================
/**
* @swagger
* /Users:
*   get:
*     summary: Get all users
*     tags: [Users]
*     responses:
*       200:
*         description: List of Users
*/
app.get("/Users", (req, res) => {
    db.query("SELECT * FROM users", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});
/**
* @swagger
* /Users/{id}:
*   get:
*     summary: Get a Users by ID
*     tags: [Users]
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema:
*           type: integer
*     responses:
*       200:
*         description: Users record
*/
app.get("/Users/:id", (req, res) => {
    const { id } = req.params;
    db.query("SELECT * FROM users WHERE userId = ?", [id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).send("Users not found");
        res.json(results[0]);
    });
});
/**
* @swagger
* /Users/register:
*   post:
*     summary: Create a new User
*     tags: [Users]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/Users'
*     responses:
*       201:
*         description: User created
*/
app.post("/Users/register", async (req, res) => {
  try {
    const data = req.body;

    // hash password before saving
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const sql = `
        INSERT INTO users
        (userName, emailId, password)
        VALUES (?, ?, ?)
    `;
    const values = [
      data.userName,
      data.emailId,
      hashedPassword, // save hashed password
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).send({ message: "Email already exists" });
        }
        return res.status(500).send(err);
      }
      res.status(201).send({ message: "User created", id: result.insertId });
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});
/**
* @swagger
* /Users/{id}:
*   put:
*     summary: Update a User
*     tags: [Users]
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema:
*           type: integer
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               userName:
*                 type: string
*                 example: John Doe
*               emailId:
*                 type: string
*                 example: john@example.com
*               password:
*                 type: string
*                 example: MySecurePass123
*     responses:
*       200:
*         description: User updated
*/
app.put("/Users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const sql = `
        UPDATE users SET
        userName=?, emailId=?, password=?
        WHERE userId=?
    `;

    const values = [
      data.userName,
      data.emailId,
      hashedPassword,
      id // ✅ correct
    ];

    db.query(sql, values, (err, result) => {
      if (err) return res.status(500).send(err);
      res.send({ status:201,message: "User updated" });
    });
  } catch (err) {
    res.status(500).send({status:500, message: err.message });
  }
});


/**
* @swagger
* /Users/{id}:
*   delete:
*     summary: Delete a User
*     tags: [Users]
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema:
*           type: integer
*     responses:
*       200:
*         description: User deleted
*/
app.delete("/Users/:id", (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM users WHERE userId = ?", [id], (err) => {
        if (err) return res.status(500).send(err);
        res.send({ message: "User deleted" });
    });
});


// =========Login Api =================
/**
* @swagger
* /Users/login:
*   post:
*     summary: Login user
*     tags: [Users]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               emailId:
*                 type: string
*                 example: danny@gmail.com
*               password:
*                 type: string
*                 example: danny@123
*     responses:
*       200:
*         description: Login successful
*       401:
*         description: Invalid credentials
*       404:
*         description: User not found
*/
// app.post("/Users/login", (req, res) => {
//     const { emailId, password } = req.body;

//     if (!emailId || !password) {
//         return res.status(400).send({ message: "Email and Password are required" });
//     }

//     const sql = "SELECT * FROM users WHERE emailId = ?";
//     db.query(sql, [emailId], (err, results) => {
//         if (err) return res.status(500).send(err);

//         if (results.length === 0) {
//             return res.status(404).send({ message: "User not found" });
//         }

//         const user = results[0];

//         // Simple password check (for production use bcrypt)
//         if (user.password !== password) {
//             return res.status(401).send({ message: "Invalid credentials" });
//         }

//         res.status(200).send({
//             message: "Login successful",
//             user: {
//                 userId: user.userId,
//                 userName: user.userName,
//                 emailId: user.emailId,
//             }
//         });
//     });
// });


app.post("/Users/login", (req, res) => {
  const { emailId, password } = req.body;

  db.query("SELECT * FROM users WHERE emailId = ?", [emailId], async (err, results) => {
    if (err) return res.status(500).send(err);
    if (results.length === 0) return res.status(400).send({ message: "User not found" });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(400).send({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
//  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.send({ satus:200,message: "Login successful",data:results, token });
  });
});

// ---------------- Start Server ----------------
app.listen(8080, () => {
    console.log(`Server running at http://localhost:${8080}`);
});

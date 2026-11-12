import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import agendaRouter from "./agendas";
import storageRouter from "./storage";
import sellSheetRouter from "./sellSheet";
import pricingRouter from "./pricing";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(agendaRouter);
router.use(storageRouter);
router.use(sellSheetRouter);
router.use(pricingRouter);

export default router;

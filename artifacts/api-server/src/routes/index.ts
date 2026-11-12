import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import agendaRouter from "./agendas";
import storageRouter from "./storage";
import sellSheetRouter from "./sellSheet";
import pricingRouter from "./pricing";
import researchRouter from "./demo-research";
import pitchDeckRouter from "./pitch-deck";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(agendaRouter);
router.use(storageRouter);
router.use(sellSheetRouter);
router.use(pricingRouter);
router.use(researchRouter);
router.use(pitchDeckRouter);

export default router;

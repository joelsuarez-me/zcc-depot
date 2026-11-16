import { Router, type IRouter } from "express";
import { GetObjectionHandlingResponse } from "@workspace/api-zod";
import { presenterAccess } from "../middlewares/presenterAccess";
import { objectionHandlingGuide } from "../lib/objection-handling";

const router: IRouter = Router();
router.get("/objection-handling", presenterAccess, (_req, res): void => {
  res.json(GetObjectionHandlingResponse.parse(objectionHandlingGuide));
});
export default router;

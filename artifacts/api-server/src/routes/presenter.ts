import { Router, type IRouter } from "express";
import { GetPresenterContentResponse } from "@workspace/api-zod";
import { presenterAccess } from "../middlewares/presenterAccess";
import { depotPrivateContent } from "../lib/depot-private-content";
import { presenterRooms } from "../lib/presenter-rooms";

const router: IRouter = Router();
router.get("/presenter/content", presenterAccess, (_req, res): void => {
  res.json(GetPresenterContentResponse.parse({ legacy: depotPrivateContent, rooms: presenterRooms }));
});
export default router;

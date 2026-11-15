import { Router, type IRouter } from "express";
import { GetCompeteBattlecardResponse } from "@workspace/api-zod";
import { competeFive9 } from "../lib/competeFive9";
import { presenterAccess } from "../middlewares/presenterAccess";

const router: IRouter = Router();
router.use("/compete", presenterAccess);
router.get("/compete/:competitor", (req, res): void => {
  if (req.params.competitor !== "five9") {
    res.status(404).json({ error: "Competitor not found." });
    return;
  }
  res.json(GetCompeteBattlecardResponse.parse(competeFive9));
});
export default router;

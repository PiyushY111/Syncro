import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { createPortfolio } from "../controllers/portfolio/createPortfolio.js";
import { getWorkspacePortfolios } from "../controllers/portfolio/getPortfolios.js";
import { getPortfolioById } from "../controllers/portfolio/getPortfolioDetails.js";
import { updatePortfolio } from "../controllers/portfolio/updatePortfolio.js";
import { deletePortfolio } from "../controllers/portfolio/deletePortfolio.js";
import { addProjectsToPortfolio, removeProjectFromPortfolio } from "../controllers/portfolio/managePortfolioProjects.js";
import { validate } from "../middlewares/validate.js";
import { 
    validateCreatePortfolio, 
    validateUpdatePortfolio, 
    validatePortfolioProjects 
} from "../validators/portfolioValidators.js";

const router = express.Router();

router.use(protect);

router.post("/", validate(validateCreatePortfolio), createPortfolio);
router.get("/workspace/:workspaceId", getWorkspacePortfolios);
router.get("/:id", getPortfolioById);
router.patch("/:id", validate(validateUpdatePortfolio), updatePortfolio);
router.delete("/:id", deletePortfolio);
router.post("/:id/projects", validate(validatePortfolioProjects), addProjectsToPortfolio);
router.delete("/:id/projects/:projectId", removeProjectFromPortfolio);

export default router;


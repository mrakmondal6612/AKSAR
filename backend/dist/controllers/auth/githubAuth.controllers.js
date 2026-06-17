"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGithubSignUpFunction = handleGithubSignUpFunction;
exports.handleGithubSignUpCallbackFunction = handleGithubSignUpCallbackFunction;
const passport_1 = __importDefault(require("passport"));
const passport_github2_1 = require("passport-github2");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_model_1 = __importDefault(require("../../models/User.model"));
const checkAuthConstraints_1 = require("../../validchecks/checkAuthConstraints");
const mailer_1 = require("../../helpers/mailer");
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
dotenv_1.default.config();
const BACKEND_DOMAIN = process.env.BACKEND_DOMAIN;
passport_1.default.use(new passport_github2_1.Strategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${BACKEND_DOMAIN}/user/signup-github/callback`,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let githubEmail;
        let randomPassword;
        let hashedPassword;
        let profileImageUrl;
        if (profile?.emails?.length) {
            githubEmail = profile.emails[0].value;
        }
        else {
            const response = await fetch("https://api.github.com/user/emails", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "User-Agent": "AKSAR",
                },
            });
            const emails = await response.json();
            const primaryEmail = emails.find((email) => email.primary) || emails[0];
            githubEmail = primaryEmail ? primaryEmail.email : undefined;
            if (!githubEmail) {
                return done(new Error("No email found in GitHub profile or via API"), undefined);
            }
        }
        randomPassword = (0, checkAuthConstraints_1.generateDummyPassword)(githubEmail);
        hashedPassword = await bcryptjs_1.default.hash(randomPassword, 10);
        if (!randomPassword) {
            return done(new Error("Error generating random password"), undefined);
        }
        if (profile?.photos?.length > 0) {
            profileImageUrl = profile.photos[0].value;
        }
        let user = await User_model_1.default.findOne({ email: githubEmail });
        if (!user) {
            const nameParts = (profile.displayName || "User").split(" ");
            const firstName = nameParts[0] || "User";
            const lastName = nameParts.slice(1).join(" ") || "User";
            const { nanoid } = await Promise.resolve().then(() => __importStar(require('nanoid')));
            user = new User_model_1.default({
                uniqueId: nanoid(),
                firstName,
                lastName,
                userName: profile.username.replace(/ /g, "_"),
                email: githubEmail,
                password: hashedPassword,
                profileImageUrl,
                emailVerificationStatus: true,
                role: "STUDENT",
            });
            await user.save();
            await (0, mailer_1.sendGithubAuthPasswordMail)(user.email, randomPassword);
        }
        return done(null, user);
    }
    catch (error) {
        return done(new Error("Something went wrong during GitHub authentication"), undefined);
    }
}));
passport_1.default.serializeUser((user, done) => {
    done(null, user._id);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await User_model_1.default.findById(id);
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
});
function handleGithubSignUpFunction(req, res, next) {
    passport_1.default.authenticate("github", { scope: ["user:email"] })(req, res, next);
}
function handleGithubSignUpCallbackFunction(req, res, next) {
    const FRONTEND_HOME_ROUTE = process.env.PUBLIC_FRONTEND_DOMAIN;
    const FRONTEND_SIGNUP_ROUTE = process.env.PUBLIC_FRONTEND_SIGNUP_ROUTE;
    passport_1.default.authenticate("github", { failureRedirect: FRONTEND_SIGNUP_ROUTE,
        successRedirect: FRONTEND_HOME_ROUTE,
    }, (err, user, info) => {
        if (err || !user) {
            return res.redirect(FRONTEND_SIGNUP_ROUTE);
        }
        const token = jsonwebtoken_1.default.sign({
            id: user._id,
            uniqueId: user.uniqueId,
            role: user.role,
        }, process.env.JWT_SECRET, { expiresIn: "15d" });
        res.redirect(`${FRONTEND_HOME_ROUTE}?success=true&message=LoginSuccessful&token=${token}`);
    })(req, res, next);
}
// const userData = {
//   userName: user.userName,
//   firstName: user.firstName,
//   lastName: user.lastName,
//   email: user.email,
//   profileImageUrl: user.profileImageUrl,
//   emailVerificationStatus: user.emailVerificationStatus,
// };
// res.redirect(`${FRONTEND_HOME_ROUTE}?success=true&message=Login successful&token=${token}&email=${userData.email}&firstName=${userData.firstName}&userName=${userData.userName}&lastName=${userData.lastName}&emailVerificationStatus=${userData.emailVerificationStatus}&profileImageUrl=${userData.profileImageUrl}`);

"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Swords } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useState } from "react";
import { signup } from "@/actions/signup";
import { toast } from "sonner";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { DialogDescription } from "@radix-ui/react-dialog";
import { verifyEmail } from "@/actions/email/verify";

const JoinButton = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [form, setForm] = useState<"login" | "signup" | "otp">("login");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");

  const handleSignup = async () => {
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("username", username);
      fd.append("password", password);
      fd.append("email", email);

      const res = await signup(fd);

      if (res.success) {
        toast(res.message, {
          duration: 3000,
          position: "bottom-right",
        });
        localStorage.setItem("userEmail", email);
        setEmail("");
        setPassword("");
        setUsername("");
        setForm("otp");
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : "Error signing up", {
        duration: 5000,
        position: "bottom-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    // replace with actual OTP verification logic
    try {
      setLoading(true);
      const userEmail = localStorage.getItem("userEmail");
      if (!userEmail) throw new Error("Error Getting User Info");
      const res = await verifyEmail(userEmail, otp);

      if (res.success) {
        toast("OTP verified successfully", {
          duration: 3000,
          position: "bottom-right",
        });
        localStorage.removeItem("userEmail");
        setForm("login");
        setOtp("");
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : "Error Verifying Email");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form === "signup") {
      handleSignup();
    } else if (form === "otp") {
      handleOtpVerify();
    } else {
      // Handle login
      console.log("Logging in:", { username, password });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="uppercase fade-pullup mt-8 border border-white font-bold text-sm sm:text-base p-6 
             text-white hover:bg-white hover:text-violet-500 
             bg-transparent relative z-10 
             shadow-[0_0_10px_#8b5cf6,0_0_20px_#8b5cf6] 
             hover:shadow-[0_0_20px_#8b5cf6,0_0_40px_#8b5cf6] 
             transition-all duration-200 ease-in-out"
        >
          <Swords className="size-6 mr-2 hover:text-violet-500  drop-shadow-[0_0_6px_#8b5cf6]" />
          <span>Join the battle</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className="border border-violet-300 bg-black/40 text-white 
        p-6 rounded-lg backdrop-blur-lg shadow-md"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {form === "login"
              ? "Login"
              : form === "otp"
                ? "Verify Your Email"
                : "Sign Up"}
          </DialogTitle>
        </DialogHeader>
        {form === "otp" && (
          <DialogDescription className="text-sm">
            An otp has been sent to your email
          </DialogDescription>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {form === "otp" && (
            <div className="space-y-2">
              <InputOTP
                value={otp}
                onChange={(value) => setOtp(value)}
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
              >
                <InputOTPGroup className="flex gap-2 justify-center">
                  {[...Array(6)].map((_, index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="w-12 h-14 text-center text-white text-xl bg-violet-400/20 
              border-x-0 border-t-0 border-b border-violet-500 rounded-sm 
              focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          )}
          {form === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-bold">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="border-x-0 border-t-0 border-b placeholder:uppercase rounded-sm border-violet-500 w-full p-3 bg-black/80
                text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          )}
          {form !== "otp" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-bold">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="border-x-0 border-t-0 border-b rounded-sm border-violet-500 uppercase w-full p-3 bg-black/80
                text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-bold">
                  Password
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="password"
                    type={isPasswordVisible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="border-x-0 border-t-0 border-b rounded-sm border-violet-500 placeholder:uppercase w-full p-3 bg-black/80
                    text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    {isPasswordVisible ? (
                      <EyeOff className="size-5 text-violet-500" />
                    ) : (
                      <Eye className="size-5 text-violet-500" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
          <DialogFooter className="mt-4">
            <div className="flex flex-col w-full">
              <Button
                type="submit"
                disabled={loading}
                className="uppercase transition-all duration-200 ease-in-out w-full border border-white text-white font-bold py-5 bg-transparent
                    hover:bg-white hover:text-violet-500 shadow-[0_0_10px_#8b5cf6,0_0_20px_#8b5cf6]"
              >
                {loading && <Swords className="animate-pulse " />}
                {!loading &&
                  (form === "login"
                    ? "Login"
                    : form === "otp"
                      ? "Verify"
                      : "Sign Up")}
              </Button>
              {form !== "otp" && (
                <div>
                  <p className="text-sm text-center mt-6">
                    {form === "login" ? (
                      <>
                        Don&apos;t have an account?{" "}
                        <span
                          className="text-violet-400 font-bold cursor-pointer hover:underline"
                          onClick={() => setForm("signup")}
                        >
                          Sign up
                        </span>
                      </>
                    ) : (
                      <>
                        Already have an account?{" "}
                        <span
                          className="text-violet-400 font-bold cursor-pointer hover:underline"
                          onClick={() => setForm("login")}
                        >
                          Login
                        </span>
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JoinButton;

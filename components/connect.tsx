import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { v4 as uuidv4 } from "uuid";
import axios from "../lib/axios";
import { useStore } from "../lib/store";

export default function Connect() {
  const [authState, setAuthState] = useState<string>("");
  const [hasMetamask, setHasMetamask] = useState<boolean>();
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const {
    user: { setUserSig, setSignedKey, userSig, signedKey },
    userNotes: { getAllNotes },
    userPublicNotes: { getPublicNotes },
    userFolders: { getFolders },
    session: { isConnected, setIsConnected, setStatus },
  } = useStore();

  useEffect(() => {
    if (!window.ethereum) {
      setAuthState("Please install MetaMask wallet");
      setHasMetamask(false);

      return;
    }

    setHasMetamask(true);
  }, []);

  async function getInitialData(sig: string, key: string) {
    setStatus("loading", "Getting data...");

    const notes = await getAllNotes(sig, key);
    const folders = await getFolders(sig, key);
    const publicNotes = await getPublicNotes(sig);

    setIsConnected(true);

    if (notes && folders && publicNotes) {
      setStatus("ok", "All set!");
    } else {
      setStatus("error", "Something went wrong");
    }
  }

  const connect = async () => {
    if (!window.ethereum) return;

    if (userSig && signedKey) {
      getInitialData(userSig, signedKey);
    } else {
      try {
        setIsConnecting(true);
        setAuthState("Connecting to your wallet...");
        const provider = new ethers.providers.Web3Provider(window.ethereum);

        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();

        setAuthState("Please sign the message...");
        const userSignature = await signer.signMessage(
          `Please sign this string. This signature will be your unique identifier:\n${process.env.NEXT_PUBLIC_RANDOM_STRING}`,
        );
        let key = "";

        try {
          const res = await axios.get(`users?userSig=${userSignature}`);

          key = res?.data.userData.key;
        } catch (err: any) {
          if (err.data.message === "User not found") {
            key = uuidv4();
            await axios.post("users", {
              userSig: userSignature,
              key,
            });
          } else {
            throw err;
          }
        }

        const sigKey = await signer.signMessage(
          `This signature will be your encryption key:\n${key}`,
        );

        if (!sigKey || !userSignature) {
          throw new Error("Missing user information");
        }

        setUserSig(userSignature);
        setSignedKey(sigKey);
        setIsConnecting(false);
        setAuthState("Connected");
        getInitialData(userSignature, sigKey);
      } catch (err: any) {
        if (err.code === 4001) {
          setAuthState("");
        } else {
          setAuthState("An error occurred. Please try again.");
        }

        setIsConnecting(false);
      }
    }
  };

  return (
    <div className="mx-auto mt-24">
      {hasMetamask && !isConnected && (
        <button
          className="mx-3 mb-9 rounded-3xl border-none bg-pistachio px-5 py-5 leading-6 drop-shadow-connect-light dark:bg-dark-3 dark:drop-shadow-connect-dark sm:py-6 sm:px-12 sm:text-xl"
          type="button"
          onClick={connect}
          disabled={isConnecting}
        >
          Connect to MetaMask wallet
        </button>
      )}
      <p>{authState}</p>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import MyNFT from "../artifacts/contracts/MyNFT.sol/MyNFT.json";
import { connectMetaMask } from "../utils/web3";
import axios from "axios";

const NFTMinting: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<string>("");
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const [isClient, setIsClient] = useState(false); // Track if the code is running client-side

  // This useEffect ensures that we know when we are client-side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const uploadToIPFS = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "pinata_api_key": `a8203b11db3aeb0bf02a`,
          "pinata_secret_api_key": `dcdba8ea2e856bfa8bdf597af4ad6a1ce8b6a4c54a777c17520189d47743c5f2`,
        },
        
      });
      console.log(process.env.NEXT_PINATA_API_KEY);
      console.log(process.env.NEXT_PINATA_SECRET_API_KEY);
      if (!response.data.IpfsHash) {
        throw new Error("IPFS upload failed, no IPFS hash returned.");
      }

      return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
      throw new Error("Error uploading file to IPFS.");
    }


  };

  const uploadMetadataToIPFS = async (metadata: any): Promise<string> => {
    try {
      const response = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", metadata, {
        headers: {
          "Content-Type": "application/json",
          "pinata_api_key": `a8203b11db3aeb0bf02a`,
          "pinata_secret_api_key": `dcdba8ea2e856bfa8bdf597af4ad6a1ce8b6a4c54a777c17520189d47743c5f2`,
        },
      });

      if (!response.data.IpfsHash) {
        throw new Error("Metadata upload failed, no IPFS hash returned.");
      }

      return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
    } catch (error) {
      console.error("Error uploading metadata to IPFS:", error);
      throw new Error("Error uploading metadata.");
    }
  };

  const handleMint = async (): Promise<void> => {
    if (!file) {
      setTransactionStatus("Please upload a valid file.");
      return;
    }

    try {
      setIsMinting(true);
      setTransactionStatus("Uploading file to IPFS...");

      const fileURL = await uploadToIPFS(file);
      setTransactionStatus("File uploaded. Creating metadata...");

      const metadata = {
        name: "My NFT",
        description: "This is a description of my NFT",
        image: fileURL,
      };

      const tokenURI = await uploadMetadataToIPFS(metadata);
      setTransactionStatus("Metadata uploaded. Connecting to MetaMask...");

      // Ensure MetaMask logic runs only on the client
      if (isClient) {
        const connection = await connectMetaMask();
        if (!connection) {
          setTransactionStatus("MetaMask not connected or installed.");
          setIsMinting(false);
          return;
        }

        const { signer } = connection;
        const contractAddress = "0x398F9a102Fd5ebEc7cc10389D974A0cEd5d8849F";
        const nftContract = new ethers.Contract(contractAddress, MyNFT.abi, signer);

        setTransactionStatus("Minting NFT...");

        const tx = await nftContract.mintNFT(tokenURI);
        const receipt = await tx.wait();

        if (receipt.status === 1) {
          setTransactionStatus(`NFT Minted! Token ID: ${receipt.events[0].args.tokenId.toString()}`);
        } else {
          setTransactionStatus("Minting failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error during minting process:", error);
      setTransactionStatus("Minting failed. Please check your MetaMask and try again.");
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-2xl">
      <h2 className="text-3xl font-bold text-center text-white mb-6">Mint Your NFT</h2>

      <div className="mb-6">
        <label htmlFor="file" className="block text-lg font-medium text-white">Upload Your File</label>
        <input
          type="file"
          id="file"
          onChange={handleFileChange}
          className="w-full p-4 mt-2 border-2 border-gray-300 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-4 focus:ring-indigo-500 transition-all duration-300 shadow-md hover:shadow-lg"
        />
      </div>

      <button
        onClick={handleMint}
        disabled={isMinting}
        className={`w-full py-4 text-lg font-semibold text-white rounded-xl transition duration-300 ${isMinting ? 'bg-gray-500 cursor-not-allowed' : 'bg-indigo-700 hover:bg-indigo-800'}`}
      >
        {isMinting ? "Minting..." : "Mint NFT"}
      </button>

      {transactionStatus && (
        <div className="mt-6 text-center">
          <p className={`text-lg font-medium ${transactionStatus.includes("failed") ? "text-red-500" : "text-green-400"}`}>
            {transactionStatus}
          </p>
        </div>
      )}
    </div>
  );
};

export default NFTMinting;

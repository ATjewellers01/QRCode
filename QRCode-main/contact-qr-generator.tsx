"use client"
import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, Mail, Sparkles, QrCode, MessageSquare, FileText, Download } from "lucide-react"
import jsPDF from "jspdf"
import Image from "next/image"
import QRCodeLib from "qrcode"
import { useState, useEffect } from "react"

interface ContactInfo {
  firstName: string
  lastName: string
  title: string
  organization: string
  phone: string
  email: string
  address: string
  website?: string
}

export default function ContactQRGenerator() {
  const [screenSize, setScreenSize] = useState({ width: 1024 }) // Default fallback

  useEffect(() => {
    // Set initial screen size
    setScreenSize({ width: window.innerWidth })
    
    // Handle resize
    const handleResize = () => {
      setScreenSize({ width: window.innerWidth })
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const getQRSize = (baseSize: number) => {
    if (screenSize.width < 640) return baseSize - 50
    if (screenSize.width < 1024) return baseSize - 20
    return baseSize
  }
  
  const contactInfo: ContactInfo = {
    firstName: "CA Akshay",
    lastName: "Bardia",
    title: "Managing Director",
    organization: "A.T. Plus Jewellers Pvt Ltd",
    phone: "+91 9977447111",
    email: "akshay@atjewels.in",
    address:
      "AT Jewellers, Kotwali Chowk, Sadar Bazar Road, Raipur, Chhattisgarh — 492001",
    website: "",
  }

  const feedbackUrl = "https://feedback-form-omega-eight.vercel.app/"

  const generateVCard = (contact: ContactInfo): string => {
    return `BEGIN:VCARD
VERSION:3.0
N:${contact.lastName};${contact.firstName};;;
FN:${contact.firstName} ${contact.lastName}
TITLE:${contact.title}
ORG:${contact.organization}
TEL:${contact.phone}
EMAIL:${contact.email}
ADR:;;${contact.address};;;;
${contact.website ? `URL:${contact.website}` : ""}
END:VCARD`.trim()
  }

  const generateQRCodeDataURL = async (text: string, options = {}): Promise<string> => {
    try {
      const qrOptions = {
        errorCorrectionLevel: "M",
        type: "image/png",
        quality: 0.92,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        width: 200,
        ...options,
      }

      const dataURL = await QRCodeLib.toDataURL(text, qrOptions)
      return dataURL
    } catch (error) {
      console.error("QR Code generation failed:", error)
      throw error
    }
  }

  const loadImageAsDataURL = (imgId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = document.getElementById(imgId) as HTMLImageElement
      if (!img) {
        console.error(`Image with id ${imgId} not found`)
        reject(new Error(`Image with id ${imgId} not found`))
        return
      }

      // Check if image is already loaded
      if (img.complete && img.naturalWidth > 0) {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth || img.width
        canvas.height = img.naturalHeight || img.height
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0)
        
        try {
          const dataURL = canvas.toDataURL('image/png')
          console.log(`${imgId} converted to data URL successfully`)
          resolve(dataURL)
        } catch (error) {
          console.error(`Error converting ${imgId}:`, error)
          reject(error)
        }
      } else {
        // Wait for image to load
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth || img.width
          canvas.height = img.naturalHeight || img.height
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }

          ctx.drawImage(img, 0, 0)
          
          try {
            const dataURL = canvas.toDataURL('image/png')
            console.log(`${imgId} converted to data URL successfully`)
            resolve(dataURL)
          } catch (error) {
            console.error(`Error converting ${imgId}:`, error)
            reject(error)
          }
        }
        
        img.onerror = () => {
          console.error(`Failed to load image: ${imgId}`)
          reject(new Error(`Failed to load image: ${imgId}`))
        }
      }
    })
  }

 const downloadContactPDF = async () => {
  try {
    // Small delay to ensure images are loaded
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const pdf = new jsPDF("p", "mm", "a4")
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    // Clean white background
    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, 0, pageWidth, pageHeight, "F")

    // Add JF Logo at the top center
    try {
      console.log("Loading JF Logo...")
      const jfLogoDataURL = await loadImageAsDataURL('jf-logo')
      console.log("JF Logo loaded, adding to PDF...")
      
      // JF Logo positioning - top center
      const logoWidth = 50
      const logoHeight = 35
      const logoX = (pageWidth - logoWidth) / 2
      const logoY = 40
      
      pdf.addImage(jfLogoDataURL, "PNG", logoX, logoY, logoWidth, logoHeight)
      console.log("JF Logo added to PDF successfully")
    } catch (error) {
      console.error("JF Logo error:", error)
      alert("Warning: JF Logo could not be loaded. PDF will be generated without the logo.")
    }

    // Generate and add Contact QR Code - Centered below logo
    try {
      console.log("Generating contact QR code...")
      const vCardData = generateVCard(contactInfo)
      const contactQRDataURL = await generateQRCodeDataURL(vCardData, {
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        width: 500,
      })

      // Center the QR code below the logo
      const qrSize = 100
      const qrX = (pageWidth - qrSize) / 2
      const qrY = 95 // Position below logo

      pdf.addImage(contactQRDataURL, "PNG", qrX, qrY, qrSize, qrSize)

      // Add "Save Us" text below QR code
      const textY = qrY + qrSize + 20
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(24)
      pdf.setFont("helvetica", "bold")
      
      // Add the text
      pdf.text("Save Us", pageWidth / 2, textY, { align: "center" })
      
      // Add underline manually
      const textWidth = pdf.getTextWidth("Save Us")
      const underlineY = textY + 2
      const underlineStartX = (pageWidth - textWidth) / 2
      const underlineEndX = (pageWidth + textWidth) / 2
      
      pdf.setLineWidth(0.8)
      pdf.line(underlineStartX, underlineY, underlineEndX, underlineY)

      console.log("Contact QR code added successfully")
    } catch (error) {
      console.error("Contact QR code generation failed:", error)
      // Fallback design
      const qrSize = 100
      const qrX = (pageWidth - qrSize) / 2
      const qrY = 95
      
      pdf.setFillColor(200, 200, 200)
      pdf.rect(qrX, qrY, qrSize, qrSize, "F")
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(18)
      pdf.setFont("helvetica", "bold")
      pdf.text("QR CODE", pageWidth / 2, qrY + qrSize/2, { align: "center" })
      
      // Add "Save Us" text even in fallback
      const textY = qrY + qrSize + 20
      pdf.setFontSize(24)
      pdf.text("Save Us", pageWidth / 2, textY, { align: "center" })
      
      // Add underline for fallback too
      const textWidth = pdf.getTextWidth("Save Us")
      const underlineY = textY + 2
      const underlineStartX = (pageWidth - textWidth) / 2
      const underlineEndX = (pageWidth + textWidth) / 2
      
      pdf.setLineWidth(0.8)
      pdf.line(underlineStartX, underlineY, underlineEndX, underlineY)
    }

    // Save the PDF
    pdf.save(`Save-Us-QR.pdf`)

    console.log("Contact PDF generated successfully!")
  } catch (error) {
    console.error("Error generating Contact PDF:", error)
    alert("There was an error generating the Contact PDF. Please try again.")
  }
}

 const downloadFeedbackPDF = async () => {
  try {
    const pdf = new jsPDF("p", "mm", "a4")
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    // Clean white background
    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, 0, pageWidth, pageHeight, "F")

    // Generate and add Feedback QR Code - Centered
    try {
      console.log("Generating feedback QR code...")
      const feedbackQRDataURL = await generateQRCodeDataURL(feedbackUrl, {
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        width: 400,
      })

      // Center the QR code higher on the page
      const qrSize = 80
      const qrX = (pageWidth - qrSize) / 2
      const qrY = (pageHeight - qrSize) / 2 - 20 // Move QR code up to make space for text

      pdf.addImage(feedbackQRDataURL, "PNG", qrX, qrY, qrSize, qrSize)

      // Add "Share your contact to us" text below QR code
      const textY = qrY + qrSize + 15 // Position text below QR code
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(18) // Slightly smaller font for longer text
      pdf.setFont("helvetica", "bold")
      
      // Add the text
      pdf.text("Share your contact to us", pageWidth / 2, textY, { align: "center" })
      
      // Add underline manually
      const textWidth = pdf.getTextWidth("Share your contact to us")
      const underlineY = textY + 2 // Position underline slightly below text
      const underlineStartX = (pageWidth - textWidth) / 2
      const underlineEndX = (pageWidth + textWidth) / 2
      
      pdf.setLineWidth(0.5)
      pdf.line(underlineStartX, underlineY, underlineEndX, underlineY)

      console.log("Feedback QR code added successfully")
    } catch (error) {
      console.error("Feedback QR code generation failed:", error)
      // Fallback design
      const qrSize = 80
      const qrX = (pageWidth - qrSize) / 2
      const qrY = (pageHeight - qrSize) / 2 - 20
      
      pdf.setFillColor(200, 200, 200)
      pdf.rect(qrX, qrY, qrSize, qrSize, "F")
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(16)
      pdf.setFont("helvetica", "bold")
      pdf.text("QR CODE", pageWidth / 2, qrY + qrSize/2, { align: "center" })
      
      // Add "Share your contact to us" text even in fallback
      const textY = qrY + qrSize + 15
      pdf.setFontSize(18)
      pdf.text("Share your contact to us", pageWidth / 2, textY, { align: "center" })
      
      // Add underline for fallback too
      const textWidth = pdf.getTextWidth("Share your contact to us")
      const underlineY = textY + 2
      const underlineStartX = (pageWidth - textWidth) / 2
      const underlineEndX = (pageWidth + textWidth) / 2
      
      pdf.setLineWidth(0.5)
      pdf.line(underlineStartX, underlineY, underlineEndX, underlineY)
    }

    // Save the PDF
    pdf.save(`Share-Contact-QR.pdf`)

    console.log("Feedback PDF generated successfully!")
  } catch (error) {
    console.error("Error generating Feedback PDF:", error)
    alert("There was an error generating the Feedback PDF. Please try again.")
  }
}

  const vCardData = generateVCard(contactInfo)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-purple-50 p-4 sm:p-6 lg:p-8">
      {/* Hidden logos for PDF generation */}
      <Image
        id="at-logo"
        src="/images/at-logo-new.png"
        alt="A.T. Plus Jewellers Logo"
        width={120}
        height={80}
        className="hidden"
        crossOrigin="anonymous"
      />
      <Image
        id="at-logo-circle"
        src="/images/at-logo-circle.jpg"
        alt="A.T. Plus Jewellers Circle Logo"
        width={64}
        height={64}
        className="hidden"
        crossOrigin="anonymous"
      />
      <img
        id="jf-logo"
        src="/images/JF Logo.png"
        alt="JF Logo"
        width={120}
        height={60}
        className="hidden"
        crossOrigin="anonymous"
        onLoad={() => console.log("JF Logo loaded successfully")}
        onError={(e) => console.error("JF Logo failed to load:", e)}
      />

      <div className="max-w-5xl mx-auto">
        {/* Premium Header */}
        <div className="text-center mb-8 sm:mb-12 bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 border border-white/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-purple-500/5 to-orange-500/5"></div>

          <div className="flex flex-col sm:flex-row items-center justify-center mb-4 sm:mb-6 relative z-10">
            <div className="mb-4 sm:mb-0 sm:mr-6">
              <Image
                src="/images/at-logo-new.png"
                alt="A.T. Plus Jewellers Logo"
                width={140}
                height={100}
                className="rounded-lg shadow-lg"
                priority
              />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            A.T. Plus Jewellers
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 italic font-serif mb-1 sm:mb-2">
            Professional Contact QR Generator
          </p>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600">
            Create premium digital business cards with embedded contact QR codes
          </p>
        </div>

        {/* Main QR Code Display */}
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm relative overflow-hidden mb-8">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-2xl text-center">
            <CardTitle className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-xl sm:text-2xl font-bold">
              <QrCode className="h-6 w-6 sm:h-8 sm:w-8" />
              Save Us
            </CardTitle>
            <CardDescription className="text-orange-100 text-base sm:text-lg">
              Scan to instantly save contact information
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 sm:p-8 lg:p-12 text-center bg-gradient-to-br from-gray-50 to-white">
            {/* QR Code - Centered and Responsive */}
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-purple-600 rounded-2xl sm:rounded-3xl blur-xl sm:blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500 animate-pulse"></div>

                <div
                  id="qr-code"
                  className="relative bg-white p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-2xl border-2 sm:border-4 border-gray-100 transform hover:scale-105 transition-all duration-500"
                >
                  <QRCodeSVG
                    value={vCardData}
                    size={getQRSize(300)}
                    level="M"
                    includeMargin={true}
                    fgColor="#7c3aed"
                    bgColor="#ffffff"
                  />
                </div>
              </div>
            </div>

            {/* Contact Preview Cards - Responsive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Personal Info Card */}
              <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-xl">
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="w-16 h-12 sm:w-18 sm:h-14 mr-3 rounded-lg overflow-hidden shadow-md">
                    <Image
                      src="/images/at-logo-new.png"
                      alt="AT Logo"
                      width={72}
                      height={56}
                      className="object-contain w-full h-full"
                    />
                  </div>
                  <div className="text-xs sm:text-sm text-purple-200 italic font-serif">Symbol of Trust</div>
                </div>

                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-400 mb-2">
                  {contactInfo.firstName.toUpperCase()} {contactInfo.lastName.toUpperCase()}
                </h3>
                <p className="text-sm sm:text-base lg:text-lg text-gray-200 mb-3 sm:mb-4">
                  {contactInfo.title.toUpperCase()}
                </p>

                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center">
                    <div className="bg-orange-500 p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                    <span className="text-sm sm:text-base font-semibold break-all">{contactInfo.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="bg-orange-500 p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                    <span className="text-xs sm:text-sm break-all">{contactInfo.email}</span>
                  </div>
                </div>
              </div>

              {/* Company Info Card */}
              <div className="bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-xl border-2 border-gray-100">
                <div className="text-center mb-3 sm:mb-4">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-24 h-18 sm:w-28 sm:h-20 rounded-xl overflow-hidden shadow-lg">
                      <Image
                        src="/images/at-logo-new.png"
                        alt="A.T. Plus Jewellers Logo"
                        width={112}
                        height={80}
                        className="object-contain w-full h-full"
                      />
                    </div>
                  </div>
                </div>

                <h4 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-3 sm:mb-4 text-center">
                  A.T. Plus Jewellers Pvt Ltd
                </h4>
                <div className="text-sm sm:text-base text-gray-700 text-center leading-relaxed mb-4 sm:mb-6">
                  <p className="mb-1">Office No.: 7, 3rd Floor, 69/71,</p>
                  <p className="mb-1">Panchsheela Building, Dharji Street,</p>
                  <p className="mb-3">Zaveri Bazaar, Mumbai - 400 003</p>
                  <p className="font-bold text-gray-900">Ph: 022-22417567, 49717567</p>
                </div>

                <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl p-4 text-center shadow-lg">
                  <div className="bg-orange-500 text-white text-sm font-bold py-2 px-4 rounded-full inline-block mb-3">
                    Branch
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm sm:text-base font-bold">Kolkata: 09330147111</div>
                    <div className="text-sm sm:text-base font-bold">Raipur: 9826047111</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Download Section */}
            <div className="space-y-4 sm:space-y-6">
              <Button
                onClick={downloadContactPDF}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-bold py-3 sm:py-4 px-8 sm:px-12 rounded-xl sm:rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 text-base sm:text-lg mr-0 sm:mr-4 mb-4 sm:mb-0"
              >
                <Download className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                Download Contact PDF
              </Button>

              <div className="bg-gradient-to-r from-orange-100 to-purple-100 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-orange-200">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-gray-700">
                  <div className="text-center">
                    <Phone className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm font-semibold">iPhone Camera</p>
                  </div>
                  <div className="text-center">
                    <QrCode className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm font-semibold">Android Camera</p>
                  </div>
                  <div className="text-center">
                    <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm font-semibold">QR Scanner Apps</p>
                  </div>
                </div>
                <p className="text-center text-gray-600 mt-3 sm:mt-4 font-semibold text-sm sm:text-base">
                  📱 Universal compatibility - Works with all devices and QR scanner apps
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Feedback QR Section */}
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm relative overflow-hidden mb-8">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-2xl text-center">
            <CardTitle className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-xl sm:text-2xl font-bold">
              <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8" />
              Share Your Contact To Us
            </CardTitle>
            <CardDescription className="text-green-100 text-base sm:text-lg">
              Share your information so we can assist you better.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 sm:p-8 lg:p-12 text-center bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-600 rounded-2xl sm:rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500 animate-pulse"></div>

                <div
                  id="feedback-qr"
                  className="relative bg-white p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-2xl border-2 sm:border-4 border-green-100 transform hover:scale-105 transition-all duration-500"
                >
                  <QRCodeSVG
                    value={feedbackUrl}
                    size={getQRSize(280)}
                    level="M"
                    includeMargin={true}
                    fgColor="#059669"
                    bgColor="#ffffff"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-4 sm:p-6 rounded-xl border border-green-200 mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-green-800 mb-2">📬 Get in Touch With Us!</h3>
              <p className="text-green-700 text-sm sm:text-base mb-4">
                Simply scan the code and submit your details through the form.
              </p>
              <div className="flex items-center justify-center gap-2 text-green-600">
                <MessageSquare className="h-5 w-5" />
                <span className="text-sm font-semibold">Our team is ready to assist you as soon as possible.</span>
              </div>
            </div>

            {/* Download Section for Feedback */}
            <div className="space-y-4 sm:space-y-5">
              <Button
                onClick={downloadFeedbackPDF}
                className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-800 hover:from-green-700 hover:to-emerald-900 text-white font-bold py-3 sm:py-4 px-8 sm:px-12 rounded-xl sm:rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 text-base sm:text-lg"
              >
                <Download className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                Download Share your contact PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Company Branding Footer */}
        <div className="text-center bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center justify-center mb-4">
            <div className="w-18 h-12 sm:w-22 sm:h-14 mb-3 sm:mb-0 sm:mr-4 rounded-lg overflow-hidden shadow-lg">
              <Image
                src="/images/at-logo-new.png"
                alt="AT Logo"
                width={88}
                height={56}
                className="object-cover w-full h-full"
              />
            </div>
            <span className="text-2xl sm:text-4xl font-bold">A.T. Plus Jewellers</span>
          </div>
          <p className="text-purple-200 italic text-lg sm:text-xl font-serif mb-2">Symbol of Trust Since 1957</p>
          <p className="text-purple-100 text-base sm:text-lg font-semibold">Specialist in Handmade Bangles</p>
        </div>

        {/* Botivate Powered By Footer */}
        <div className="mt-8 text-center">
          <div className="bg-gradient-to-r from-slate-800 via-purple-900 to-slate-800 text-white p-4 sm:p-6 rounded-xl shadow-lg border border-purple-500/20 relative overflow-hidden">
            {/* Subtle background animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent -skew-x-12 animate-shimmer"></div>

            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <span className="text-sm sm:text-base text-gray-300">Powered By</span>
              <a
                href="https://www.botivate.in"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 hover:scale-105 transition-all duration-300"
              >
                {/* Botivate Logo Icon */}
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-purple-500/50 transition-all duration-300">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-sm opacity-90"></div>
                </div>

                {/* Botivate Text */}
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent group-hover:from-purple-300 group-hover:via-blue-300 group-hover:to-purple-300 transition-all duration-300">
                  Botivate
                </span>

                {/* External link indicator */}
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400 group-hover:text-purple-300 transition-colors duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
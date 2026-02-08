import { getToken } from "firebase/messaging"
import { messaging } from "@/lib/firebase"

export async function requestNotificationPermission() {
  const permission = await Notification.requestPermission()

  if (permission === "granted") {
    const token = await getToken(messaging, {
      vapidKey: "BMOQmPR1Jfg0XbQ4saY31UVN9UE8buJfxZzxW9uCHDTwm9-YGw1htqDBAfSDRq5gRkG2OLkWpxt43X80NqcJV3w"
    })

    console.log("FCM Token:", token)
  } else {
    console.log("User denied notifications")
  }
}
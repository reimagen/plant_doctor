Scenarios:
1. onboarding - inventory walk through using doctor screen, doctor detects and adds plants to pending adoption section on jungle page. user reviews and accepts each plant, completing additional details in the plant detail page.
2. add new plant - captured via doctor screen. add as 3rd point on doctor page. 
3. regular watering activity - use jungle page sorting by urgency or watering schedule

plant status paths:
1. healthy - displays "water in Xd" and stays green when user has watered with a grace period of 1 day. on watering day, displays "water today" instead of "water in Xd" and button says "Mark as Watered" on watering day. 
2. small overdue threshold (determined by gemini): overdue by x days - tag says "water now - Xd overdue". button currently says "begin rescue protocol", unnecessary for simple watering. use same orange color as monitoring.
- instead of "checkup-due" see "monitoring" label
- instead of "start checkup" see "Mark as Watered" label
- once user clicks "Mark as Watered" flip to healthy
3. big threshold: gemini determines number of days overdue where user is required to start a checkup. if overdue by > x small threshold days, plant is likely in dire contidion and needs a video checkup. secondary tag after emergency saying "check-up required".
- user sees tag: "water now - overdue by X d"
- button on card says: "Mark as Watered" 
- once user clicks on button, the card status flips to monitoring and shows the start checkup button (same as monitoring button) and status as check-up due
4. monitoring: gemini decides how long plant needs to be in monitoring phase, labeled yellow. determines next checkup date required. once health is confirmed via video call, flips back into healthy status. stays in monitoring status if the video call determines that is not ready to be marked as healthy.

generate rescue plan:
- currently is created by user clicking "begin rescue protocol"
- instead should be generated during check-up video call after gemini has visually assessed the status of the plant

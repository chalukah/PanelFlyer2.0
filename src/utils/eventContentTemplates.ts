/**
 * Content generators for VET event folder documents.
 * Each function returns structured content ready to be written to Google Drive.
 */

export interface PanelistInfo {
  name: string;           // Full name with credentials e.g. "Adele Feakes" or "[PANELIST 2 - TBD]"
  firstName: string;      // First name only e.g. "Adele" or "[PANELIST 2]"
  title: string;
  company: string;
  email: string;
  phone: string;
  bio: string;
  linkedIn?: string;
}

export interface EventInfo {
  panelName: string;      // e.g. "Veterinary Ownership & Leadership Panel"
  topic: string;          // e.g. "Charge What You're Worth: How to Stop Discounting and Grow Your Practice Value"
  date: string;           // e.g. "May 13, 2026"
  dateShort: string;      // e.g. "May 13"
  dateOrdinal: string;    // e.g. "13th May"
  dayOfWeek: string;      // e.g. "Wednesday"
  dayBefore: string;      // e.g. "May 12th"
  startTime: string;      // e.g. "8:00 PM"
  endTime: string;        // e.g. "9:00 PM"
  discussionPoints: string[];
  // Derived schedule dates (computed from event date)
  emailDraft1: string;    // ~18 days before
  emailDraft2: string;    // ~15 days before
  emailDraft3: string;    // ~9 days before (Boost)
  emailDraft4: string;    // Day of event
  sms1: string;
  sms2: string;
  sms3: string;
  sms4: string;
  sms5: string;           // Evening of event
}

// ─── Partner Details / Zoom Landing Page Details ───────────────────────────

export function generateZoomLandingTab(event: EventInfo): string {
  return `Zoom Landing Page
${event.panelName}
Topic - "${event.topic}"


📅 Date: ${event.date}
🕗 Time: ${event.startTime} - ${event.endTime} EST
📋 Format: Live Zoom Panel + Moderated Q&A
💲 Cost: Complimentary for attendees


Description
Join the Veterinary Business Institute for an ownership and leadership panel designed for veterinary owners, managers, and teams looking to ${event.topic.toLowerCase()}.

In an industry facing rising costs, staffing shortages, and administrative overload, forward-thinking veterinary leaders are implementing practical solutions that drive real results. This panel will explore the strategies, frameworks, and mindsets that today's leading veterinary professionals are using to build more profitable, sustainable practices — without burning out their teams.


Key Discussion Topics Include:
${event.discussionPoints.map(p => `• ${p}`).join('\n')}




Zoom page Survey Form
Set responses as Non anonymous.
1. Full Name*
2. How would you rate the overall quality of this event? (Rating scale) *
3. What specific topics would you like us to cover in upcoming events? (Short answer)
4. How would you rate the host's effectiveness in facilitating and engaging during this event? (Rating scale)*
5. Which topics would you like us to cover in upcoming events? (Multiple choice)*
   1. Clinical
   2. Business
   3. Leadership
   4. Technology
   5. Finance
   6. Reducing Insurance Dependence
6. How likely are you to schedule a complimentary strategy meeting with our team? (Rating scale) *`;
}

export function generatePanelistTab(panelist: PanelistInfo): string {
  return `${panelist.name}
   • Full Name - ${panelist.name}
   • Contact Number - ${panelist.phone}
   • Current Position and Organization - ${panelist.title} @ ${panelist.company}
   • Email Address - ${panelist.email}
   • Short Bio (3-4 sentences) -


${panelist.bio}`;
}

// ─── Calendar Notes Sheet ──────────────────────────────────────────────────

export interface SheetData {
  tabName: string;
  rows: (string | number | null)[][];
}

export function generateCalendarNotesSheet(event: EventInfo, panelists: PanelistInfo[]): SheetData[] {
  const confirmedCount = panelists.filter(p => !p.name.includes('TBD')).length;

  const eventInfoRows: (string | number | null)[][] = [
    ['', ''],  // header row
    ['Event Format', 'Webinar - Panel Discussion with Q&A'],
    ['Event Category', 'VBI'],
    ['Event Theme/Brand', event.panelName],
    ['Event Expert Category', event.panelName],
    ['Event Topic', event.topic],
    ['Event Date', event.date],
    ['Event Time', `${event.startTime} to ${event.endTime} EST`],
    ['Event Platform', 'Zoom'],
    ['', ''],  // spacer
    ['No of Speakers/Panelist', confirmedCount],
    ['Event Moderator/Host', 'Lester De Alwis'],
    ['Event Assistant', 'Liyanna Faith'],
    ['Event Slide Deck', event.dateShort],
    ['Event Description', `Join the Veterinary Business Institute for an ownership and leadership panel: ${event.topic}. This panel is designed for veterinary owners, managers, and teams. Date: ${event.date} | Time: ${event.startTime} - ${event.endTime} EST | Platform: Zoom | Format: Panel Discussion + Interactive Q&A | Cost: Complimentary`],
    ['Webinar Zoom Page (For Additional Reference of Michael)', ''],
  ];

  return [
    { tabName: 'Event Information', rows: eventInfoRows },
    { tabName: 'Process Sheet', rows: [['Task', 'Status', 'Due Date', 'Notes'], ['Create event folder structure', 'Complete', '', ''], ['Upload panelist headshots', 'Pending', '', ''], ['Create short links', 'Pending', '', ''], ['Send invitations', 'Pending', '', ''], ['Setup Zoom registration', 'Pending', '', ''], ['Create promo materials', 'Pending', '', ''], ['Send calendar invites', 'Pending', '', ''], ['Send questions to panelists', 'Pending', '', ''], ['Post social media graphics', 'Pending', '', ''], ['Day-before reminder sent', 'Pending', '', ''], ['Day-of tech check', 'Pending', '', ''], ['Post-event thank you sent', 'Pending', '', '']] },
  ];
}

// ─── Short Links Sheet ─────────────────────────────────────────────────────

export function generateShortLinksSheet(event: EventInfo, panelist: PanelistInfo): SheetData[] {
  return [{
    tabName: 'Sheet1',
    rows: [
      ['Name of Event', 'Date', 'Expert', 'Platform', 'Link'],
      ['VET Expert Panel', event.dateShort, panelist.name, 'Email', '[SHORT LINK - TBD]'],
      ['VET Expert Panel', event.dateShort, panelist.name, 'Email', '[SHORT LINK - TBD]'],
      ['VET Expert Panel', event.dateShort, panelist.name, 'Email', '[SHORT LINK - TBD]'],
      ['VET Expert Panel', event.dateShort, panelist.name, 'Email', '[SHORT LINK - TBD]'],
      ['VET Expert Panel', event.dateShort, panelist.name, 'Social Media', '[SHORT LINK - TBD]'],
      ['VET Expert Panel', event.dateShort, panelist.name, 'Social Media', '[SHORT LINK - TBD]'],
      ['VET Expert Panel', event.dateShort, panelist.name, 'Social Media', '[SHORT LINK - TBD]'],
      ['VET Expert Panel', event.dateShort, panelist.name, 'Social Media', '[SHORT LINK - TBD]'],
      ['VET Expert Panel', event.dateShort, panelist.name, 'LinkedIn Event', '[SHORT LINK - TBD]'],
    ],
  }];
}

// ─── Promotional Materials ─────────────────────────────────────────────────

export function generatePromoMaterialsContent(event: EventInfo, panelist: PanelistInfo): string {
  return `Hi ${panelist.firstName},


We've developed the promotional material and updated the zoom landing page!

Unique Panelist Join Link
You may have already received an invite from Michael Walker through "no-reply@zoom.us,"
Please use this link to join the webinar on the day of the event, for your convenience I've added it here.


Promotional Materials
This is your Unique Registration Links: [UNIQUE REGISTRATION LINK - TBD]

To help spread the word, we've prepared a set of promotional materials, including graphics, captions, and email drafts. Here's what's available:


   * Social Media Graphics
   * All graphics for LinkedIn, Facebook, and Instagram are accessible here: Graphic Promotions.


   * Captions for Social Media
   * We've created ready-to-use captions to make sharing easy. Suggested posting schedule:
   * Post 1: At a time of your convenience.
   * Post 2: At a time of your convenience.
   * Post 3: At a time of your convenience.
   * Post 4: ${event.dayBefore} at a time of your convenience.
   * Post 5: ${event.dateShort} at a time of your convenience.


   * Email Drafts for Your Network
We'd love your help in spreading the word with your network of
professionals through your email list. Suggested email schedule:
   * Draft 1: Please schedule for ${event.emailDraft1}.
   * Draft 2: Please schedule for ${event.emailDraft2}.
   * Draft 3: Please schedule for ${event.emailDraft3}.
   * Draft 4: Please schedule for ${event.emailDraft4}.


   * SMS Drafts for Your Network
We'd love your help in spreading the word with your network of
Professionals through SMS/Texts. Suggested SMS Schedule:
   * SMS 1: At a time of your convenience.
   * SMS 2: Please schedule for ${event.sms2}.
   * SMS 3: Please schedule for ${event.sms3}.
   * SMS 4: Please schedule for ${event.sms4}.
   * SMS 5: Please schedule for ${event.sms5}.


Let me know if you need anything else or have questions. I'm here to assist and ensure this is a smooth and successful experience!


Best regards,


Chaluka Harsha
Event Coordinator
Veterinary Business Institute`;
}

// ─── Email Drafts ──────────────────────────────────────────────────────────

export function generateEmailDraftsContent(event: EventInfo, panelists: PanelistInfo[]): Record<string, string> {
  const panelTitle = `${event.panelName}: ${event.topic}`;
  const panelistList = panelists.map(p => `- ${p.name}, ${p.title}, ${p.company}`).join('\n');

  const tabs: Record<string, string> = {};

  // ── Invite ──
  tabs['Invite'] = `Invitation to Share Your Expertise at the Veterinary Business Institute's ${event.panelName}.

Hi [Panelist Name],
I hope you're doing well! I'm thrilled to connect with you.
My name is Chaluka Harsha, and I serve as an Event Coordinator for Veterinary Business Institute (VBI), where we provide high-quality educational content, networking opportunities, and resources for VET professionals.
I've been following your remarkable work to the veterinary community and believe you would provide tremendous value to our audience through a joint online event. We have an upcoming online event and have shortlisted you as a guest speaker.

A Quick Look at What We Do
At the Veterinary Business Podcast, we cover a wide range of topics, including business strategies, marketing trends, financial management, client relations, AI, law, and more. Our main goal is to provide veterinarians, practice owners, and office managers in the USA and Canada, with the knowledge and insights they need to manage their practices effectively.

👉 For more information, please visit our website: Veterinary Business Institute

This webinar is designed for veterinary owners, managers, and teams working on ${event.topic.toLowerCase()}. It will focus on practical, real-world actions such as ${event.discussionPoints.slice(0, 2).join(' and ')}. The webinar will run in a panel format with interactive Q&A, featuring expert speakers who will share step-by-step guidance, implementation ideas, and measurable ways to apply these strategies inside everyday veterinary operations.

Event Snapshot
• Date & Time: ${event.dateOrdinal}, ${event.date.split(',')[1]?.trim() ?? '2026'} | ${event.startTime}-${event.endTime} EST
• Duration: 1hr
• Event Type: Online panel
• Number of Speakers: 3-4
• Format: Panel Discussion + Live Q&A
• Platform: Zoom (Live Webinar)
• Event topic: ${event.topic}

🔑 Key discussion points
${event.discussionPoints.map(p => `• ${p}`).join('\n')}

   • A host from our academy will be there to support you throughout the session.

What We're Looking For
We believe your voice and expertise would resonate strongly with our global audience. You've been shortlisted based on your impactful work, and we're confident you'd add tremendous value to the conversation.

🚀 Why Join Us
• No financial commitment - the event is fully sponsored and free to attend (for speakers and attendees).
• Global Stage: Engage with a vibrant audience of VET professionals from across the world and the event will be recorded and made available for post-event viewing.
• Thought Leadership: Be recognized as a key voice shaping the evolution of VET professionals.
• Network Expansion: Connect with like-minded experts and industry leaders.
• Promotional materials: Promotional materials will be provided to share with your audience.
• Promotional Visibility: Enjoy extensive promotion across our podcast, website, and social media.
• Exclusive Opportunities: Will be considered a long-term partner for future collaborations as a token of our appreciation (we organize mini summits, summits, expert panels as well).

🤝 How the Partnership Works
As a featured speaker, we'll provide you with ready-made promotional assets to share with your network. The more visibility we build together, the larger and more engaged your audience will be during the session.

🎤 Speaker Benefits
With your commitment and support in bringing registrations, we are planning to extend the following benefits as a token of appreciation:

Benefits | Level 1 | Level 2 | Level 3 | Level 4
1-9 registrations | 10-14 registrations | 15-49 registrations | 50+ registrations
Replay recording link of your session | Yes | Yes | Yes | Yes
3-4 branded video clips (1:1 and 9:16 formats) with captions | Yes | Yes | Yes | Yes
📩 Event Lead List (all registrants and attendees) | -- | Yes | Yes | Yes
📝 Publication of an article about you on our podcast/website | -- | Yes | -- | --
🎥 Podcast Tip Feature | -- | -- | Yes | --
🎙 Feature on our podcast | -- | -- | -- | Yes
🔄 Consideration as a Long-Term Partner with priority invitations | -- | -- | Yes | Yes

What Past Speakers Say
[Insert 1–2 short testimonials from past speakers about their experience. This builds trust and social proof.]

See Us in Action
Past Panel Replay: https://vimeo.com/1154888535
Our Website: https://www.veterinarybusinessinstitute.com/

Next Steps
Reply to this message to confirm your interest.
We'll send you your promotional kit and speaker prep materials.
Go live and shine!

We're incredibly excited about this opportunity and would be honored to have you on board. Looking forward to hearing from you!

Thank you,
Chaluka Harsha
Event Coordinator
Veterinary Business Institute`;

  // ── Followup ──
  tabs['Followup'] = `Subject: Following Up - ${panelTitle} (${event.dateOrdinal})
Hi [First Name],

I wanted to follow up on my earlier message about our upcoming panel on ${event.dateShort}, ${event.startTime} - ${event.endTime} EST.

This is a complimentary live panel on Zoom, streaming to LinkedIn and Facebook, featuring veterinary leaders sharing real strategies for ${event.topic.toLowerCase()}.

Registration Link: [Registration Link - TBD]

If you have any questions or would like more information, please don't hesitate to reach out.

Best regards,
Chaluka Harsha
Event Coordinator
Veterinary Business Institute`;

  // ── Schedule ──
  tabs['Schedule'] = `${event.date} - ${event.panelName}
${event.topic}

Date: ${event.dayOfWeek}, ${event.date}
Time: ${event.startTime} - ${event.endTime} EST
Platform: Zoom
Format: Panel Discussion + Interactive Q&A
Cost: Complimentary

Panelists:
${panelistList}

Key Discussion Points:
${event.discussionPoints.map(p => `- ${p}`).join('\n')}

Email Schedule:
Draft 1: ${event.emailDraft1}
Draft 2: ${event.emailDraft2}
Draft 3: ${event.emailDraft3} (Boost)
Draft 4: ${event.emailDraft4} (Day of)

SMS Schedule:
SMS 1: ${event.sms1}
SMS 2: ${event.sms2}
SMS 3: ${event.sms3}
SMS 4: ${event.sms4}
SMS 5: ${event.sms5} (evening)`;

  // ── Per-panelist templates ──
  for (const p of panelists) {
    const fn = p.firstName;

    // Thrilled
    tabs[`${fn} Thrilled`] = `Thrilled to Have You on Our Expert Panel Series!
Hi ${fn},
Thrilled to hear you are on board for the ${panelTitle}. Thank you for confirming. We cannot wait to spotlight your expertise alongside our hosts on ${event.dayOfWeek}, ${event.date}.
Here is how things will run:
   * The webinar will be delivered in a live Q&A format, and our team will manage promotion, attendee emails, and Zoom tech from the 7:50 PM EST tech check through the ${event.startTime} – ${event.endTime} EST session.
   * We will send ready-to-use promo graphics, copy, and your unique registration link so you can share it with your network whenever it fits your schedule.
   * Discussion questions will be drafted and sent in advance, and we are happy to weave in any angles or examples that you would like to emphasize.
   * Active contributors are first in line for future panels, Lunch & Learns, and Veterinary Business Institute summit opportunities.
To finalize the promotional materials, could you please share the following details at your convenience?
   * Full name as you would like it listed (with credentials)
   * Contact number for day-of coordination
   * Current title and organization (for the on-screen intro)
   * Preferred email address for promotions (if different from this thread)
   * Any links you would like us to include (website, LinkedIn, scheduler, etc.)
Please let me know if you have questions or need anything as we prep. Excited to learn from you on ${event.date}.
Warm regards,
Chaluka Harsha
Event Coordinator
Veterinary Business Institute`;

    // Calendar
    tabs[`${fn} Calendar`] = `Calendar Invite - ${event.topic} | ${event.dateOrdinal} ${event.date.split(',')[1]?.trim() ?? ''}

Hi ${fn},

Thank you so much for sharing your details with us, we're absolutely thrilled to have you on the panel!
I'm sending over the calendar invite for your session to make things easier on your side. It's set to ${event.dateOrdinal} ${event.date.split(',')[1]?.trim() ?? ''} as a gentle reminder leading up to the event.

To help spread the buzz, our team will be putting together some awesome promotional materials that we'll share with you soon. These will be perfect for posting on your social media platforms to rally your community and get them excited about joining us. We're hoping each panelist can inspire at least 15-20 registrations from their network to help make this event a lively, diverse gathering, your voice will be key in making that happen!

We're really looking forward to having you with us and can't wait for the great discussion ahead!

Warmly,

Chaluka Harsha
Event Coordinator
Veterinary Business Institute`;

    // Questions
    tabs[`${fn} Questions`] = `Hi ${fn},

I've drafted these sets of questions for you in preparation for the upcoming panel discussion, "${panelTitle}" If you'd like to adjust or suggest additional questions, please feel free to share your thoughts.

If the questions meet your approval, kindly reply to this email confirming the questions. If you'd like to make any changes or refinements, you're welcome to do so.

Looking forward to your feedback!

Please note: 4 questions will be directed to you during the panel. You will receive 4 focused questions during the discussion.

1. [QUESTION 1 - TO BE GENERATED BASED ON ${p.name}'s BIO AND EXPERTISE]
2. [QUESTION 2 - TO BE GENERATED BASED ON ${p.name}'s BIO AND EXPERTISE]
3. [QUESTION 3 - TO BE GENERATED BASED ON ${p.name}'s BIO AND EXPERTISE]
4. [QUESTION 4 - TO BE GENERATED BASED ON ${p.name}'s BIO AND EXPERTISE]

Warm regards,
Chaluka Harsha
Event Coordinator
Veterinary Business Institute`;

    // Boost
    tabs[`${fn} Boost`] = `Lets Boost Registrations for the Expert Panel!
Hi ${fn},
You have been amazing, and we can't wait to share your expertise with our audience on ${event.dateShort}.
We're reaching out because we currently have a low number of registrations, and we'd love to see more attendees benefiting from this incredible discussion. Your insights are invaluable, and with your help in promoting the event, we can ensure that a vast audience gets to learn from your expertise.
Please share the event with your network to encourage more registrations. We truly appreciate your support in making this panel a success.
Registration Link: [Registration Link - TBD]
Once again, thank you for your amazing support. We're looking forward to an engaging and impactful session.
Best regards,
Chaluka Harsha
Event Coordinator
Veterinary Business Institute`;

    // Few days
    tabs[`${fn} Few days`] = `Hi ${fn},
Just a quick reminder that our ${event.panelName} is in a few days!
Event Details:
🗓 Date: ${event.dayOfWeek}, ${event.date}
🕖 Time: ${event.startTime} to ${event.endTime} EST
🎯 Topic: ${event.topic}
🎙 Your Join Link: Click here to join the panel
Final Social Media Push!
If you haven't already, this is a great time to share the event with your network. We've provided all the graphics and captions in your promotional materials package.
Access your promotional materials: View Your Graphics & Captions.
We're excited to see you on ${event.dateShort}!
Best regards,
Chaluka Harsha
Events Coordinator
Veterinary Business Institute`;

    // Q Confirm
    tabs[`${fn} Q Confirm`] = `Hi ${fn},
We're excited to have you on the ${panelTitle} next ${event.dayOfWeek} evening. As we lock the moderator script, I wanted to confirm that the question lineup below still works on your end.
When you have a minute, please reply to confirm. If you'd like anything refined or reprioritized, feel free to send your notes and I'll update our prep materials immediately.
Quick timing note: Each panelist will receive four questions during the live discussion. Please feel free to reorder or refine anything so you are completely comfortable.
Your Questions:

[QUESTION 1 - TO BE FILLED]

[QUESTION 2 - TO BE FILLED]

[QUESTION 3 - TO BE FILLED]

[QUESTION 4 - TO BE FILLED]

Best regards,
Chaluka Harsha
Event Coordinator
Veterinary Business Institute`;

    // 3 Days
    tabs[`${fn} 3 Days`] = `Hi ${fn},
Just a quick reminder that our ${event.panelName} is in 3 days!
Event Details:
🗓 Date: ${event.dayOfWeek}, ${event.date}
🕖 Time: ${event.startTime} to ${event.endTime} EST
🎯 Topic: ${event.topic}
🎙 Your Join Link: Click here to join the panel
Final Social Media Push!
If you haven't already, this is a great time to share the event with your network. We've provided all the graphics and captions in your promotional materials package.
Access your promotional materials: View Your Graphics & Captions.
We're excited to see you on ${event.dateShort}!
Best regards,
Chaluka Harsha
Event Coordinator
Veterinary Business Institute`;

    // Tmrw
    tabs[`${fn} Tmrw`] = `Hi ${fn},
Tomorrow is the big day! Here are all the final details for the ${event.panelName}.
Your invite has already been sent, but here's the registration link as well, just in case:
Unique Panelist Join Link

Please use this link to join the webinar tomorrow: Click here to join
IMPORTANT - Please Save These Details
📅 Tomorrow - ${event.date}
🕖 Tech Check: 7:50 PM EST (Join 10 minutes early)
🎙 Event Start: ${event.startTime} EST
⏰ Event End: ${event.endTime} EST
One More Thing!
If you haven't already, please share one final post on social media today to remind your network. Your promotional materials have a "One Day Before" graphic and caption ready to go.
Access your promotional materials: View Your Graphics & Captions
See you tomorrow at 7:50 PM EST!
Best regards,
Chaluka Harsha
Event Coordinator
Veterinary Business Institute`;

    // Banner
    tabs[`${fn} Banner`] = `Final Reminder: Panel Today - Last Banner Update
Hi ${fn},
Since the panel is around the corner, we are incredibly excited to have your expertise showcased during the event!
This is a kind reminder to express our gratitude for your efforts in promoting the panel. If possible, we would truly appreciate having the final banner up today to maximize visibility. Please let us know if you need any assistance with this.
Link: Banner Document

Thank you again for your continued support. We look forward to an incredible discussion!

Best regards,
Chaluka Harsha
Event Coordinator
Veterinary Business Institute`;

    // Few Hours
    tabs[`${fn} Few Hours`] = `Subject: The Panel is Just a Few Hours Away - See You Soon!
Hi ${fn},
I hope you're doing well! Just a quick reminder that the ${panelTitle} is just a few hours away. We're excited to have you join us for this insightful discussion!

Date: ${event.dayOfWeek}, ${event.date}
Time: ${event.startTime} - ${event.endTime} EST
Format: Panel Discussion + Interactive Q&A
Platform: Zoom (Live-streamed on LinkedIn and Facebook)
Event Registration: Complimentary

Your invite has already been sent, and we truly appreciate your participation. Looking forward to seeing you there and hearing your valuable insights!

Also, you can use: [ZOOM JOIN LINK - TBD]

Let me know if you have any questions. See you soon!
Best,
Chaluka Harsha
Event Coordinator
Veterinary Business Institute`;

    // Few Away
    tabs[`${fn} Few Away`] = `Panel is a few Minutes away!
Hi ${fn},
Just a quick reminder that our ${panelTitle} is starting in a few minutes, we are excited to have you share your insights and expertise.
ZOOM LINK TO THE PANEL: [ZOOM JOIN LINK - TBD]

Thank you,
Chaluka Harsha
Event Coordinator
Veterinary Business Institute`;

    // Thankyou
    tabs[`${fn} Thankyou`] = `Thank You for Attending the Expert Panel Discussion

Hi ${fn},

I hope this message finds you well.

On behalf of the Veterinary Business Institute, I would like to sincerely thank you for attending the "${panelTitle}" on ${event.date.toUpperCase()}.

We appreciate your time and engagement in this important discussion.

As promised, please find the resources from the event below:
Event Recording: [Recording Link - TBD]

Registration Report: [Registration Sheet Link - TBD]

We hope these will be helpful for your follow-ups and continued engagement with the participants.
Additionally, I would like to introduce Reshani Tamasha from our Partnership Team. She will be reaching out to discuss the partnership benefits that you are eligible for and to guide you through the available opportunities.
Once again, thank you for your partnership and for helping make this event a success.

BOOK A MEETING: https://www.veterinarybusinessinstitute.com/msm/

Thank you,
Chaluka Harsha
Event Coordinator
Veterinary Business Institute`;
  }

  // ── Non-per-panelist tabs ──

  tabs['Random Reg reminder'] = `Hi,
Hope you're doing well! Just a gentle nudge, please check your inbox/spam for the latest update on our Veterinary Expert Panel. Registrations are picking up, but your quick share with your network could make a big difference. We'd love your voice to inspire more pros to join!
Excited to chat soon!
Warmly,
Chaluka Harsha
Event Coordinator
Veterinary Business Institute`;

  tabs['Text Reminders'] = `Join Us Live – Tomorrow!
Topic: ${panelTitle}
Date: ${event.dateShort}, ${event.date.split(',')[1]?.trim() ?? '2026'}
Time: ${event.startTime} EST
You're already registered don't forget to join us for an empowering session on modern veterinary leadership. We will dive into how ${event.topic.toLowerCase()}.
Join live on Zoom: ID [ZOOM ID — TBD]
Log in 10 min early! Q&A + recording if you miss it.
See you there!
-Veterinary Business Institute-
—-------------------------------------------------------------------------------------------------------
Join Us Live – It's Not Too Late!
We're just 30 minutes away from
${panelTitle}
Our panelists are sharing real-world strategies for ${event.topic.toLowerCase()}.
Don't miss this opportunity to gain clarity and leadership tools for a changing profession.
🔹 Join us now on Zoom!
📌 Zoom ID:[ZOOM ID — TBD]
-Veterinary Business Institute-
—-------------------------------------------------------------------------------------------------------

We're Starting in Just 15 Minutes!
${panelTitle}
 Join us now on Zoom!
 Zoom ID:[ZOOM ID — TBD]
${event.discussionPoints.slice(0, 2).map(p => `Gain expert insights on ${p.toLowerCase()}.`).join(' ')}
Don't miss out - grab your spot now!
See you there!
-Veterinary Business Institute-
—-------------------------------------------------------------------------------------------------------
 We are LIVE NOW!
${panelTitle}
 Join us now on Zoom!
 Zoom ID:[ZOOM ID — TBD]
Don't miss out! Grab your spot now!
See you there!
-Veterinary Business Institute-`;

  let textPanelists = '';
  for (const p of panelists) {
    textPanelists += `

Hi ${p.firstName},

I hope this message finds you well. My name is Chaluka, and I'm reaching out on behalf of the Veterinary Business Institute Reminding your upcoming participation in our panel, which is happening in an Hour! I have shared all details to your email.

Thank you,
Chaluka Harsha
Event Coordinator
Veterinary Business Institute

—---------------------------------------------------------------------------------------------------------------

Hi ${p.firstName},

This is Chaluka from the Veterinary Business Institute! Just a quick reminder about the upcoming panel today. I've shared all the details in your email. Please check your inbox and spam folder in case it landed there. Looking forward to having you on the panel!

Thank you,
Chaluka Harsha
Event Coordinator
Veterinary Business Institute
..........................................
`;
  }
  tabs['Text Reminder Panelists'] = `1 Hr before the panel starts${textPanelists}`;

  tabs['ICP Targeted mail'] = `Subject: [First Name], Your Free Spot at the ${event.dateShort} Veterinary Panel
Hi [First Name],

I noticed you registered for our upcoming ${event.panelName} on ${event.dateShort} - thank you!

As one of our ICP-qualified attendees, I wanted to personally reach out. This panel features:
${panelistList}

They'll be covering ${event.topic.toLowerCase()}.

Date: ${event.dayOfWeek}, ${event.date} | ${event.startTime} - ${event.endTime} EST
Platform: Zoom (Live-streamed on LinkedIn & Facebook)
Cost: Complimentary

Registration Link: [Registration Link - TBD]

Recording Link (post-event): [Recording Link - TBD]

After the panel, schedule a complimentary strategy session:
BOOK A MEETING: https://www.veterinarybusinessinstitute.com/msm/

Looking forward to seeing you at the panel!

Best regards,
Chaluka Harsha
Event Coordinator
Veterinary Business Institute`;

  tabs['No shows'] = `Subject: You Missed the Panel - Watch the Recording!
Hi [First Name],

We noticed you registered but weren't able to make it to the ${event.panelName} on ${event.dateShort}.

The good news: the full recording is available for you!

Watch the full recording here: [Watch the full recording here - TBD]

Key takeaways:
${event.discussionPoints.map(p => `- ${p}`).join('\n')}

Our next panel is [NEXT PANEL DATE] - join us live!
Register for free here: [Next Panel Registration Link - TBD]

Book your free MSM here: https://www.veterinarybusinessinstitute.com/msm/

Hope to see you at the next one!

Warm regards,
Chaluka Harsha
Event Coordinator
Veterinary Business Institute`;

  tabs['Tab 69'] = '';

  return tabs;
}

// ─── Zoom Chat DMs ─────────────────────────────────────────────────────────

export function generateZoomChatDMs(event: EventInfo, panelists: PanelistInfo[]): string {
  const panelTitle = `${event.panelName}: ${event.topic}`;
  let content = `Zoom Chat DMs - ${event.dateOrdinal} ${event.date.split(',')[1]?.trim() ?? ''}
${panelTitle}

=== PANELIST DMs ===

`;
  for (const p of panelists) {
    content += `--- ${p.name} ---
Hi ${p.firstName}! Welcome to the panel. Here are your details for today:
🎙 You're live at ${event.startTime} EST
📋 Topic: ${event.topic}
⏰ Tech check: 7:50 PM EST — please join 10 mins early
Thank you for being here!

`;
  }
  content += `=== ATTENDEE WELCOME MESSAGE ===

Welcome to the ${panelTitle}! 🎉
We're so glad you're here. The panel starts at ${event.startTime} EST.
💬 Use the Q&A feature to submit your questions for our panelists.
📢 Feel free to share this session with your colleagues!

=== REGISTRATION LINK DM ===

Hi [Name]! Thank you for joining us today. Here's the registration link to share with your network: [REGISTRATION LINK - TBD]

=== POST-EVENT DM ===

Thank you for attending today's panel! 🙏
📹 Recording will be available within 48 hours.
📅 Book a free strategy session: https://www.veterinarybusinessinstitute.com/msm/
See you at our next panel!`;
  return content;
}

// ─── Reshanis Posting ──────────────────────────────────────────────────────

export function generateReshanisPosting(event: EventInfo, panelists: PanelistInfo[]): string {
  const panelTitle = `${event.panelName}: ${event.topic}`;
  const confirmedPanelists = panelists.filter(p => !p.name.includes('TBD'));

  return `Reshanis Posting - ${event.dateOrdinal}
${panelTitle}

=== SOCIAL MEDIA POSTING SCHEDULE ===

POST 1 - [Schedule at convenience]
🎙 Exciting News! We're thrilled to announce our upcoming ${event.panelName}!
📅 ${event.date} | ${event.startTime} - ${event.endTime} EST
💡 Topic: "${event.topic}"
Register for FREE: [REGISTRATION LINK - TBD]
#VeterinaryBusiness #VetPanel #VBI

POST 2 - [Schedule at convenience]
Meet our expert panelists for the upcoming ${event.panelName}! 🌟
${confirmedPanelists.map(p => `✅ ${p.name} - ${p.title} @ ${p.company}`).join('\n')}
${panelists.filter(p => p.name.includes('TBD')).map(() => '⏳ [PANELIST - TBD]').join('\n')}
📅 ${event.date} | ${event.startTime} EST
Register FREE: [REGISTRATION LINK - TBD]
#VeterinaryLeadership #VBI

POST 3 - [Schedule at convenience]
⏰ Don't miss out! Our ${event.panelName} is coming up on ${event.dateShort}!
🔑 Key topics:
${event.discussionPoints.map(p => `• ${p}`).join('\n')}
📅 ${event.date} | ${event.startTime} - ${event.endTime} EST
🔗 Register FREE: [REGISTRATION LINK - TBD]

POST 4 - ${event.dayBefore}
📣 TOMORROW! Join us for the ${event.panelName}
${event.date} | ${event.startTime} - ${event.endTime} EST
"${event.topic}"
Register now (it's FREE!): [REGISTRATION LINK - TBD]
#VeterinaryBusiness #VetPanel

POST 5 - ${event.dateShort} (Day of)
🔴 WE'RE LIVE TODAY!
${event.panelName}: "${event.topic}"
🕗 ${event.startTime} EST on Zoom
Join us: [ZOOM LINK - TBD]
#VetPanel #VBI #VeterinaryLeadership

=== PARTNERSHIP OUTREACH NOTES ===

For each confirmed panelist, reach out post-event to discuss:
1. Lead list delivery
2. Branded clip creation and delivery
3. Article publication (if Level 2+)
4. Podcast feature opportunities (if Level 3+)
5. Long-term partnership benefits

Contact: Reshani Tamasha
Email: [Reshani's email - TBD]`;
}

// ─── Helper: build EventInfo from raw data ─────────────────────────────────

export function buildEventInfo(raw: {
  panelName: string;
  topic: string;
  date: Date;
  discussionPoints: string[];
}): EventInfo {
  const { panelName, topic, date, discussionPoints } = raw;

  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const ordinals = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th',
    '10th', '11th', '12th', '13th', '14th', '15th', '16th', '17th', '18th', '19th',
    '20th', '21st', '22nd', '23rd', '24th', '25th', '26th', '27th', '28th', '29th',
    '30th', '31st'];

  const d = date.getDate();
  const m = date.getMonth();
  const y = date.getFullYear();

  const dateStr = `${months[m]} ${d}, ${y}`;
  const dateShort = `${months[m]} ${d}`;
  const dateOrdinal = `${ordinals[d]} ${months[m]}`;
  const dayOfWeek = days[date.getDay()];

  const dayBeforeDate = new Date(date);
  dayBeforeDate.setDate(d - 1);
  const dayBefore = `${months[dayBeforeDate.getMonth()]} ${ordinals[dayBeforeDate.getDate()]}`;

  // Email/SMS schedule: relative to event date
  const fmt = (dt: Date) => `${months[dt.getMonth()].slice(0, 3)} ${dt.getDate()}`;
  const daysOffset = (n: number) => { const dt = new Date(date); dt.setDate(dt.getDate() + n); return dt; };

  return {
    panelName,
    topic,
    date: dateStr,
    dateShort,
    dateOrdinal,
    dayOfWeek,
    dayBefore,
    startTime: '8:00 PM',
    endTime: '9:00 PM',
    discussionPoints,
    emailDraft1: fmt(daysOffset(-18)),
    emailDraft2: fmt(daysOffset(-15)),
    emailDraft3: fmt(daysOffset(-9)),
    emailDraft4: fmt(date),
    sms1: fmt(daysOffset(-18)),
    sms2: fmt(daysOffset(-12)),
    sms3: fmt(daysOffset(-6)),
    sms4: fmt(date),
    sms5: fmt(date),
  };
}

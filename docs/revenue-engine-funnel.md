# Revenue Engine Funnel

See plan: High-Conversion VPN Revenue Engine — Implementation Plan.

## Funnel flow (mermaid)

```mermaid
flowchart TB
    subgraph entry [Entry]
        Start["/start"]
        RefLink["ref_ / pay_ deep link"]
        Start --> Lang{Has locale?}
        RefLink --> Lang
        Lang -->|No| ChooseLang[Choose language]
        Lang -->|Yes| HasSub{Active sub?}
        ChooseLang --> EntryMsg[Entry message]
        EntryMsg --> B1[Start Free Trial]
        EntryMsg --> B2[View Plans]
        EntryMsg --> B3[See Servers]
    end
    subgraph trial [Trial]
        B1 --> TrialProv[Auto-provision trial 24h]
        TrialProv --> FirstPeer[Create 1 peer, send config]
        FirstPeer --> Connected["Connected: server, speed, encrypted"]
        Connected --> TrialCTA["Trial ends in 24h / Keep tunnel active"]
    end
    subgraph payment [Payment]
        HasSub -->|No| Plans[Plans: 1m / 3m Most Popular / 12m Best Value]
        B2 --> Plans
        TrialEnd["Trial ended"] --> Paused["Your private tunnel is paused"]
        Paused --> Resume[Resume Secure Access]
        Paused --> Upgrade[Upgrade to Premium]
        Plans --> Invoice[Invoice / Stars]
        Invoice --> Webhook[Payment webhook]
        Webhook --> Active[Active sub + menu]
    end
    subgraph retention [Retention]
        Renew3d["3d before expiry: Your tunnel expires soon"]
        Renew1d["1d: Don't lose your secure route"]
        AfterExp["After expiry: Reconnect instantly"]
        Cancel["Cancel intent"] --> Survey["What went wrong?"]
        Survey --> Price[Too expensive]
        Survey --> Speed[Speed issue]
        Survey --> NotNeeded[Not needed]
        Survey --> Other[Other]
        Price --> RetentionDiscount["20% retention discount"]
        NotNeeded --> PauseOffer["Offer pause instead of cancel"]
    end
    subgraph referral [Referral]
        EarnDays["Earn Free VPN Days"]
        EarnDays --> Link[Referral link]
        Link --> Reward["+7 days per paid referral"]
        Reward --> Progress["Progress bar / days earned"]
    end
    entry --> trial
    trial --> payment
    payment --> retention
    retention --> payment
    referral --> payment
```

## Key copy

- Entry: "You are 1 tap away from secure private internet."
- Trial connected: "You are connected to {server}. Speed: X Mbps. Your traffic is encrypted." + "Trial ends in 24h."
- Tunnel paused: "Your private tunnel is paused." [Resume Secure Access] [Upgrade to Premium]
- Plans: 1 month | 3 months (Most Popular) | 12 months (Best Value); "Average user stays 7 months."
- Referral: "Earn Free VPN Days", "+7 days per paid referral", "You earned X secure days this month."

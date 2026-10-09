export interface Article {
  id: number;
  source_name: string;
  source_type: "reddit" | "news" | "blog" | string;
  title: string;
  url: string;
  bias_score: number;
  bias_label: string;
  sentiment_score: number;
  emotion: string;
  framing: string;
  main_claim: string;
  missing_voices?: string;
  loaded_words: string[];
  sensationalism_score?: number;
  economic_axis?: number;
  social_axis?: number;
  evidence_quote?: string;
  published_at?: string;
}

export interface TopicStats {
  articles_count: number;
  avg_bias: number;
  bias_label: string;
  avg_sentiment: number;
  sentiment_label: string;
  dominant_tone: string;
  avg_sensationalism?: number;
  source_distribution: {
    news: number;
    reddit: number;
    blog: number;
  };
  bias_spectrum: {
    left: number;
    center: number;
    right: number;
  };
  framing_distribution: {
    Opportunity: number;
    Threat: number;
    Neutral: number;
    Conflict: number;
  };
}

export interface TopicAnalysis {
  topic: string;
  count: number;
  echo_alert: string;
  stats: TopicStats;
  articles: Article[];
}

export const DEMO_TOPICS: Record<string, TopicAnalysis> = {
  "Artificial Intelligence": {
    topic: "Artificial Intelligence",
    count: 12,
    echo_alert:
      'Analysis of "Artificial Intelligence" coverage reveals a left-leaning perspective distribution across 12 sources. The overall sentiment is neutral, with "threat" being the dominant narrative frame. Both progressive and conservative viewpoints are represented, though with varying emphasis. Consider seeking out center-right publications for alternative perspectives on this topic.',
    stats: {
      articles_count: 12,
      avg_bias: 0.3,
      bias_label: "Balanced",
      avg_sentiment: -0.13,
      sentiment_label: "Neutral",
      dominant_tone: "Neutral",
      source_distribution: {
        news: 5,
        reddit: 4,
        blog: 3,
      },
      bias_spectrum: {
        left: 3,
        center: 7,
        right: 2,
      },
      framing_distribution: {
        Opportunity: 3,
        Threat: 4,
        Neutral: 4,
        Conflict: 1,
      },
    },
    articles: [
      {
        id: 1,
        source_name: "BBC News",
        source_type: "news",
        title: "Artificial Intelligence Regulation: Global Leaders Meet to Discuss Framework",
        url: "https://www.bbc.com/news/technology",
        bias_score: -1.2,
        bias_label: "Center Left",
        sentiment_score: 0.05,
        emotion: "Neutral",
        framing: "Opportunity",
        main_claim: "International cooperation is vital to standardise AI safety protocols without stalling economic innovation.",
        missing_voices: "Startup founders outside the G7 and open-source contributors.",
        loaded_words: ["balanced", "protecting"],
        published_at: "2026-04-10T14:30:00Z",
      },
      {
        id: 2,
        source_name: "r/technology",
        source_type: "reddit",
        title: "OpenArtificial Intelligence just killed another competitor - this monopoly is getting out of control",
        url: "https://reddit.com/r/technology",
        bias_score: -4.5,
        bias_label: "Left",
        sentiment_score: -0.65,
        emotion: "Outrage",
        framing: "Threat",
        main_claim: "Aggressive pricing and closed ecosystems by major AI labs are stifling open-source innovation.",
        missing_voices: "Venture capitalists investing in competitive infrastructure.",
        loaded_words: ["monopoly", "killed", "threatens"],
        published_at: "2026-04-10T12:15:00Z",
      },
      {
        id: 3,
        source_name: "Fox News",
        source_type: "news",
        title: "Biden Admin Artificial Intelligence Rules Could Cripple American Innovation",
        url: "https://foxnews.com/tech",
        bias_score: 5.2,
        bias_label: "Right",
        sentiment_score: -0.5,
        emotion: "Negative",
        framing: "Threat",
        main_claim: "Federal compliance burdens risk ceding global technological dominance to international competitors.",
        missing_voices: "Academic ethicists and civil liberties watchdogs.",
        loaded_words: ["cripple", "overreaching", "threaten"],
        published_at: "2026-04-09T18:45:00Z",
      },
      {
        id: 4,
        source_name: "TechCrunch",
        source_type: "blog",
        title: "The State of Artificial Intelligence in 2024: A Balanced Assessment",
        url: "https://techcrunch.com/artificial-intelligence",
        bias_score: 0.2,
        bias_label: "Center",
        sentiment_score: 0.1,
        emotion: "Neutral",
        framing: "Neutral",
        main_claim: "Enterprise adoption is maturing as companies move past pilot experiments toward ROI-driven implementations.",
        missing_voices: "Workers impacted by corporate automation.",
        loaded_words: ["growth", "adoption", "balanced"],
        published_at: "2026-04-10T09:00:00Z",
      },
      {
        id: 5,
        source_name: "r/Conservative",
        source_type: "reddit",
        title: "Woke Artificial Intelligence Censorship: ChatGPT refuses to write anything conservative",
        url: "https://reddit.com/r/Conservative",
        bias_score: 8.5,
        bias_label: "Far Right",
        sentiment_score: -0.75,
        emotion: "Outrage",
        framing: "Conflict",
        main_claim: "Guardrails imposed by tech firms enforce ideological orthodoxy on political discussions.",
        missing_voices: "Engineers responsible for prompt filtering and safety alignment.",
        loaded_words: ["woke", "censorship", "dangerous"],
        published_at: "2026-04-08T22:20:00Z",
      },
      {
        id: 6,
        source_name: "Reuters",
        source_type: "news",
        title: "Tech Companies Report Mixed Q4 Results Amid Artificial Intelligence Investment Surge",
        url: "https://reuters.com/business",
        bias_score: 0.0,
        bias_label: "Center",
        sentiment_score: -0.05,
        emotion: "Neutral",
        framing: "Neutral",
        main_claim: "Wall Street scrutinises elevated capex expenditures against deferred monetization timelines.",
        missing_voices: "Retail investors and tech union representatives.",
        loaded_words: ["surge", "uncertainty"],
        published_at: "2026-04-09T16:10:00Z",
      },
      {
        id: 7,
        source_name: "The Verge",
        source_type: "blog",
        title: "Inside the Open Source Counter-Offensive to Proprietary AI Models",
        url: "https://theverge.com/tech",
        bias_score: -2.1,
        bias_label: "Center Left",
        sentiment_score: 0.35,
        emotion: "Positive",
        framing: "Opportunity",
        main_claim: "Decentralized weights and local inference tooling provide a genuine alternative to big tech cloud monopolies.",
        missing_voices: "Cybersecurity experts warning about ungoverned model deployment.",
        loaded_words: ["democratize", "freedom"],
        published_at: "2026-04-07T11:40:00Z",
      },
      {
        id: 8,
        source_name: "Wired",
        source_type: "blog",
        title: "The Carbon Footprint of Generative AI Data Centers is Skyrocketing",
        url: "https://wired.com/story/ai-energy-consumption",
        bias_score: -2.8,
        bias_label: "Center Left",
        sentiment_score: -0.4,
        emotion: "Negative",
        framing: "Threat",
        main_claim: "Grid operators are postponing clean energy transitions to accommodate hyperscaler power requirements.",
        missing_voices: "Energy executives and nuclear power advocates.",
        loaded_words: ["skyrocketing", "unsustainable"],
        published_at: "2026-04-06T15:30:00Z",
      },
      {
        id: 9,
        source_name: "r/artificial",
        source_type: "reddit",
        title: "Autonomous AI agents are fundamentally changing developer productivity this week",
        url: "https://reddit.com/r/artificial",
        bias_score: 0.5,
        bias_label: "Center",
        sentiment_score: 0.45,
        emotion: "Positive",
        framing: "Opportunity",
        main_claim: "Coding workflows are shifting from syntax generation to architecture oversight.",
        missing_voices: "Junior engineers concerned about entry-level job pipelines.",
        loaded_words: ["breakthrough", "transformative"],
        published_at: "2026-04-10T17:00:00Z",
      },
      {
        id: 10,
        source_name: "r/Futurology",
        source_type: "reddit",
        title: "Economists warn white collar job displacement from AI will hit sooner than anticipated",
        url: "https://reddit.com/r/Futurology",
        bias_score: -3.5,
        bias_label: "Left",
        sentiment_score: -0.55,
        emotion: "Negative",
        framing: "Threat",
        main_claim: "Middle management and analytical professions lack policy safety nets as automation accelerates.",
        missing_voices: "Industry leaders citing historical employment re-skilling trends.",
        loaded_words: ["displacement", "vulnerable"],
        published_at: "2026-04-08T08:20:00Z",
      },
      {
        id: 11,
        source_name: "The Wall Street Journal",
        source_type: "news",
        title: "Corporate America Grapples with AI Governance and Return on Investment",
        url: "https://wsj.com/business",
        bias_score: 2.4,
        bias_label: "Center Right",
        sentiment_score: 0.1,
        emotion: "Neutral",
        framing: "Neutral",
        main_claim: "Boardrooms demand verifiable productivity milestones before committing supplementary capital.",
        missing_voices: "Consumer privacy advocacy groups.",
        loaded_words: ["scrutiny", "governance"],
        published_at: "2026-04-07T13:10:00Z",
      },
      {
        id: 12,
        source_name: "The Guardian",
        source_type: "news",
        title: "Algorithmic Bias and Surveillance: Why Civil Rights Groups Demand Strict Oversight",
        url: "https://theguardian.com/technology",
        bias_score: -4.0,
        bias_label: "Left",
        sentiment_score: -0.45,
        emotion: "Negative",
        framing: "Conflict",
        main_claim: "Facial recognition and predictive policing algorithms continue to disproportionately harm minority communities.",
        missing_voices: "Law enforcement technical advisors.",
        loaded_words: ["discrimination", "surveillance"],
        published_at: "2026-04-05T19:00:00Z",
      },
    ],
  },
  "Climate Change": {
    topic: "Climate Change",
    count: 10,
    echo_alert:
      'Coverage of "Climate Change" displays acute polarity between regulatory reform and economic transition costs. While environmental outlets center systemic crisis, market sources emphasize grid reliability and capital allocation.',
    stats: {
      articles_count: 10,
      avg_bias: -1.2,
      bias_label: "Left-Leaning",
      avg_sentiment: -0.32,
      sentiment_label: "Negative",
      dominant_tone: "Concern",
      source_distribution: { news: 5, reddit: 3, blog: 2 },
      bias_spectrum: { left: 5, center: 4, right: 1 },
      framing_distribution: { Opportunity: 2, Threat: 5, Neutral: 2, Conflict: 1 },
    },
    articles: [
      {
        id: 101,
        source_name: "The Guardian",
        source_type: "news",
        title: "Global Temperatures Break Another Monthly Record as Scientists Sound Alarm",
        url: "https://theguardian.com/environment",
        bias_score: -4.8,
        bias_label: "Left",
        sentiment_score: -0.7,
        emotion: "Alarm",
        framing: "Threat",
        main_claim: "Unprecedented ocean thermal anomalies indicate climate tipping points are approaching quicker than predicted.",
        missing_voices: "Developing nations requiring climate adaptation finance.",
        loaded_words: ["catastrophic", "reckless", "tipping-point"],
        published_at: "2026-04-10T10:00:00Z",
      },
      {
        id: 102,
        source_name: "Reuters",
        source_type: "news",
        title: "Renewable Energy Capacity Surpasses Coal in Key European Grids",
        url: "https://reuters.com/sustainability",
        bias_score: -0.5,
        bias_label: "Center",
        sentiment_score: 0.4,
        emotion: "Positive",
        framing: "Opportunity",
        main_claim: "Rapid solar and battery deployments have structurally diminished fossil fuel reliance across Western Europe.",
        missing_voices: "Conventional utility grid operators managing intermittency.",
        loaded_words: ["milestone", "accelerating"],
        published_at: "2026-04-09T14:20:00Z",
      },
      {
        id: 103,
        source_name: "The Wall Street Journal",
        source_type: "news",
        title: "Grid Reliability Concerns Mount as Clean Energy Mandates Squeeze Baseload Power",
        url: "https://wsj.com/energy",
        bias_score: 3.2,
        bias_label: "Center Right",
        sentiment_score: -0.3,
        emotion: "Negative",
        framing: "Threat",
        main_claim: "Accelerated plant retirements outpace grid storage capabilities, creating regional brownout vulnerabilities.",
        missing_voices: "Renewable equipment manufacturers.",
        loaded_words: ["shortages", "ill-conceived", "strain"],
        published_at: "2026-04-08T11:00:00Z",
      },
      {
        id: 104,
        source_name: "r/futurology",
        source_type: "reddit",
        title: "Sodium-ion batteries are finally scaling and could fix the renewable storage bottle-neck",
        url: "https://reddit.com/r/futurology",
        bias_score: -1.0,
        bias_label: "Center Left",
        sentiment_score: 0.5,
        emotion: "Optimism",
        framing: "Opportunity",
        main_claim: "Abundant raw materials make sodium batteries uniquely viable for non-transport grid scale storage.",
        missing_voices: "Lithium supply chain mining executives.",
        loaded_words: ["game-changer", "scalable"],
        published_at: "2026-04-07T16:00:00Z",
      },
    ],
  },
  "Immigration Policy": {
    topic: "Immigration Policy",
    count: 8,
    echo_alert:
      'Coverage of "Immigration Policy" demonstrates sharp partisan divergence: conservative outlets focus on border security and municipal budget strains, while progressive outlets emphasize humanitarian rights and labor contribution.',
    stats: {
      articles_count: 8,
      avg_bias: 0.8,
      bias_label: "Balanced",
      avg_sentiment: -0.45,
      sentiment_label: "Negative",
      dominant_tone: "Conflict",
      source_distribution: { news: 4, reddit: 3, blog: 1 },
      bias_spectrum: { left: 3, center: 2, right: 3 },
      framing_distribution: { Opportunity: 1, Threat: 4, Neutral: 1, Conflict: 2 },
    },
    articles: [
      {
        id: 201,
        source_name: "Associated Press",
        source_type: "news",
        title: "Bipartisan Senate Group Proposes Overhaul of Asylum Adjudication Procedures",
        url: "https://apnews.com/immigration",
        bias_score: 0.1,
        bias_label: "Center",
        sentiment_score: 0.0,
        emotion: "Neutral",
        framing: "Neutral",
        main_claim: "Proposed reforms aim to shorten adjudication backlog from years to 90 days with increased judicial staffing.",
        missing_voices: "Community shelter coordinators and asylum seekers themselves.",
        loaded_words: ["negotiations", "framework"],
        published_at: "2026-04-09T18:00:00Z",
      },
      {
        id: 202,
        source_name: "Fox News",
        source_type: "news",
        title: "Mayors Sound Alarm as Surge in Border Crossings Overwhelms City Resources",
        url: "https://foxnews.com/us",
        bias_score: 6.2,
        bias_label: "Right",
        sentiment_score: -0.65,
        emotion: "Outrage",
        framing: "Threat",
        main_claim: "Municipal budget defunds essential public services to absorb emergency housing costs.",
        missing_voices: "Immigration attorneys and humanitarian organizations.",
        loaded_words: ["inundated", "crisis", "breaking-point"],
        published_at: "2026-04-08T20:30:00Z",
      },
    ],
  },
  "Economic Policy": {
    topic: "Economic Policy",
    count: 8,
    echo_alert:
      'Analysis of "Economic Policy" highlights diverging perspectives on interest rate trajectories, labor participation, and industrial subsidies across mainstream and alternative financial channels.',
    stats: {
      articles_count: 8,
      avg_bias: 0.1,
      bias_label: "Balanced",
      avg_sentiment: 0.02,
      sentiment_label: "Neutral",
      dominant_tone: "Neutral",
      source_distribution: { news: 5, reddit: 2, blog: 1 },
      bias_spectrum: { left: 2, center: 4, right: 2 },
      framing_distribution: { Opportunity: 3, Threat: 2, Neutral: 3, Conflict: 0 },
    },
    articles: [
      {
        id: 301,
        source_name: "Bloomberg",
        source_type: "news",
        title: "Federal Reserve Maintains Steady Hand on Rates Amid Sticky Core Inflation",
        url: "https://bloomberg.com/economics",
        bias_score: 0.0,
        bias_label: "Center",
        sentiment_score: 0.05,
        emotion: "Neutral",
        framing: "Neutral",
        main_claim: "Central bankers prioritise durable inflation moderation over preemptive rate cuts.",
        missing_voices: "Indebted small business owners.",
        loaded_words: ["resilient", "prudent"],
        published_at: "2026-04-10T15:00:00Z",
      },
    ],
  },
  "Healthcare Reform": {
    topic: "Healthcare Reform",
    count: 8,
    echo_alert:
      'Discourse on "Healthcare Reform" centers on prescription drug pricing caps versus pharmaceutical R&D incentives, with Reddit communities emphasizing out-of-pocket patient debt.',
    stats: {
      articles_count: 8,
      avg_bias: -0.9,
      bias_label: "Balanced",
      avg_sentiment: -0.22,
      sentiment_label: "Negative",
      dominant_tone: "Frustration",
      source_distribution: { news: 4, reddit: 3, blog: 1 },
      bias_spectrum: { left: 4, center: 3, right: 1 },
      framing_distribution: { Opportunity: 2, Threat: 3, Neutral: 2, Conflict: 1 },
    },
    articles: [
      {
        id: 401,
        source_name: "NPR",
        source_type: "news",
        title: "Medicare Drug Negotiations Bring First Wave of Significant Price Reductions",
        url: "https://npr.org/health",
        bias_score: -1.8,
        bias_label: "Center Left",
        sentiment_score: 0.35,
        emotion: "Positive",
        framing: "Opportunity",
        main_claim: "Direct price negotiations yield substantial savings for elderly patients on maintenance medications.",
        missing_voices: "Biotechnology venture capital firms.",
        loaded_words: ["relief", "historic"],
        published_at: "2026-04-09T13:00:00Z",
      },
    ],
  },
};

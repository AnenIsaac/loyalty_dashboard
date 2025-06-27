"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Download, Info, Plus, MessageCircle, Users, TrendingUp, Award, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LoadingComponent } from "@/components/ui/loading-component"
import { ErrorComponent } from "@/components/ui/error-component"
import { EmptyStateComponent } from "@/components/ui/empty-state-component"
import { CustomersDetailTable } from "@/components/customers-detail-table"
import { CustomerInteractionsTable } from "./customer-interactions-table"
import { RewardsTable } from "@/components/rewards-table"
import { RecordActivityModal } from "@/components/record-activity-modal"
import { SendBulkMessageModal } from "@/components/send-bulk-message-modal"
import { FilterPopup } from "@/components/filter-popup"
import { SortMenu } from "@/components/sort-menu"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"
import type { 
  BasePageProps, 
  Customer, 
  CustomerInteraction, 
  RewardsCatalog, 
  CustomerReward, 
  ProcessedCustomer,
  FilterOption,
  CustomerMetrics,
  Business
} from "@/types/common"

interface CustomersPageProps extends BasePageProps {}

interface CustomersPageData {
  business: Business | null
  interactions: CustomerInteraction[]
  customers: Customer[]
  rewardsCatalog: RewardsCatalog[]
  customerRewards: CustomerReward[]
}

// Dummy data
const dummyBusiness: Business = {
  id: "1",
  name: "Demo Coffee Shop",
  points_conversion: 10, // 10 shillings = 1 point
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z",
  user_id: "1"
}

const dummyCustomers: Customer[] = [
  {
    id: "1",
    full_name: "Donna Carter",
    phone_number: "+254700931183",
    email: "donna.carter@example.com",
    nickname: "Donna",
    created_at: "2023-05-03T21:00:00.000Z",
    updated_at: "2023-05-03T21:00:00.000Z"
  },
  {
    id: "2",
    full_name: "Anthony Green",
    phone_number: "+254703526566",
    email: "anthony.green@example.com",
    nickname: "Anthony",
    created_at: "2023-06-17T21:00:00.000Z",
    updated_at: "2023-06-17T21:00:00.000Z"
  },
  {
    id: "3",
    full_name: "Jessica Martinez",
    phone_number: "+254707865951",
    email: "jessica.martinez@example.com",
    nickname: "Jessica",
    created_at: "2023-01-07T21:00:00.000Z",
    updated_at: "2023-01-07T21:00:00.000Z"
  },
  {
    id: "4",
    full_name: "Robert White",
    phone_number: "+254708234876",
    email: "robert.white@example.com",
    nickname: "Robert",
    created_at: "2023-05-26T21:00:00.000Z",
    updated_at: "2023-05-26T21:00:00.000Z"
  },
  {
    id: "5",
    full_name: "Sarah Wilson",
    phone_number: "+254709693457",
    email: "sarah.wilson@example.com",
    nickname: "Sarah",
    created_at: "2023-09-05T21:00:00.000Z",
    updated_at: "2023-09-05T21:00:00.000Z"
  },
  {
    id: "6",
    full_name: "Joshua Phillips",
    phone_number: "+254708192054",
    email: "joshua.phillips@example.com",
    nickname: "Joshua",
    created_at: "2023-07-27T21:00:00.000Z",
    updated_at: "2023-07-27T21:00:00.000Z"
  },
  {
    id: "7",
    full_name: "Jeffrey Cox",
    phone_number: "+254708225908",
    email: "jeffrey.cox@example.com",
    nickname: "Jeffrey",
    created_at: "2023-09-05T21:00:00.000Z",
    updated_at: "2023-09-05T21:00:00.000Z"
  },
  {
    id: "8",
    full_name: "Brian Rodriguez",
    phone_number: "+254707126180",
    email: "brian.rodriguez@example.com",
    nickname: "Brian",
    created_at: "2023-04-19T21:00:00.000Z",
    updated_at: "2023-04-19T21:00:00.000Z"
  },
  {
    id: "9",
    full_name: "Brian Rodriguez",
    phone_number: "+254703130168",
    email: "brian.rodriguez@example.com",
    nickname: "Brian",
    created_at: "2023-11-07T21:00:00.000Z",
    updated_at: "2023-11-07T21:00:00.000Z"
  },
  {
    id: "10",
    full_name: "Thomas Hernandez",
    phone_number: "+254704807335",
    email: "thomas.hernandez@example.com",
    nickname: "Thomas",
    created_at: "2023-04-17T21:00:00.000Z",
    updated_at: "2023-04-17T21:00:00.000Z"
  },
  {
    id: "11",
    full_name: "Timothy Bailey",
    phone_number: "+254706244361",
    email: "timothy.bailey@example.com",
    nickname: "Timothy",
    created_at: "2023-12-10T21:00:00.000Z",
    updated_at: "2023-12-10T21:00:00.000Z"
  },
  {
    id: "12",
    full_name: "James Garcia",
    phone_number: "+254703158109",
    email: "james.garcia@example.com",
    nickname: "James",
    created_at: "2023-07-04T21:00:00.000Z",
    updated_at: "2023-07-04T21:00:00.000Z"
  },
  {
    id: "13",
    full_name: "Jessica Richardson",
    phone_number: "+254700029431",
    email: "jessica.richardson@example.com",
    nickname: "Jessica",
    created_at: "2023-08-11T21:00:00.000Z",
    updated_at: "2023-08-11T21:00:00.000Z"
  },
  {
    id: "14",
    full_name: "Ruth Turner",
    phone_number: "+254703157833",
    email: "ruth.turner@example.com",
    nickname: "Ruth",
    created_at: "2023-09-27T21:00:00.000Z",
    updated_at: "2023-09-27T21:00:00.000Z"
  },
  {
    id: "15",
    full_name: "Lisa Collins",
    phone_number: "+254703134083",
    email: "lisa.collins@example.com",
    nickname: "Lisa",
    created_at: "2023-02-08T21:00:00.000Z",
    updated_at: "2023-02-08T21:00:00.000Z"
  },
  {
    id: "16",
    full_name: "Carol Perez",
    phone_number: "+254700591178",
    email: "carol.perez@example.com",
    nickname: "Carol",
    created_at: "2023-11-27T21:00:00.000Z",
    updated_at: "2023-11-27T21:00:00.000Z"
  },
  {
    id: "17",
    full_name: "Sharon Campbell",
    phone_number: "+254701946570",
    email: "sharon.campbell@example.com",
    nickname: "Sharon",
    created_at: "2023-12-13T21:00:00.000Z",
    updated_at: "2023-12-13T21:00:00.000Z"
  },
  {
    id: "18",
    full_name: "Edward Morris",
    phone_number: "+254704447040",
    email: "edward.morris@example.com",
    nickname: "Edward",
    created_at: "2023-01-14T21:00:00.000Z",
    updated_at: "2023-01-14T21:00:00.000Z"
  },
  {
    id: "19",
    full_name: "Steven Nelson",
    phone_number: "+254709117174",
    email: "steven.nelson@example.com",
    nickname: "Steven",
    created_at: "2023-09-11T21:00:00.000Z",
    updated_at: "2023-09-11T21:00:00.000Z"
  },
  {
    id: "20",
    full_name: "Dorothy Lopez",
    phone_number: "+254704423640",
    email: "dorothy.lopez@example.com",
    nickname: "Dorothy",
    created_at: "2023-11-12T21:00:00.000Z",
    updated_at: "2023-11-12T21:00:00.000Z"
  },
  {
    id: "21",
    full_name: "James Garcia",
    phone_number: "+254700141075",
    email: "james.garcia@example.com",
    nickname: "James",
    created_at: "2023-07-23T21:00:00.000Z",
    updated_at: "2023-07-23T21:00:00.000Z"
  },
  {
    id: "22",
    full_name: "Mary Rodriguez",
    phone_number: "+254704815068",
    email: "mary.rodriguez@example.com",
    nickname: "Mary",
    created_at: "2023-07-21T21:00:00.000Z",
    updated_at: "2023-07-21T21:00:00.000Z"
  },
  {
    id: "23",
    full_name: "Ruth Turner",
    phone_number: "+254707543836",
    email: "ruth.turner@example.com",
    nickname: "Ruth",
    created_at: "2023-12-15T21:00:00.000Z",
    updated_at: "2023-12-15T21:00:00.000Z"
  },
  {
    id: "24",
    full_name: "Linda Hall",
    phone_number: "+254704037432",
    email: "linda.hall@example.com",
    nickname: "Linda",
    created_at: "2023-06-01T21:00:00.000Z",
    updated_at: "2023-06-01T21:00:00.000Z"
  },
  {
    id: "25",
    full_name: "Edward Morris",
    phone_number: "+254705301612",
    email: "edward.morris@example.com",
    nickname: "Edward",
    created_at: "2023-06-09T21:00:00.000Z",
    updated_at: "2023-06-09T21:00:00.000Z"
  },
  {
    id: "26",
    full_name: "Joseph Allen",
    phone_number: "+254703753714",
    email: "joseph.allen@example.com",
    nickname: "Joseph",
    created_at: "2023-10-05T21:00:00.000Z",
    updated_at: "2023-10-05T21:00:00.000Z"
  },
  {
    id: "27",
    full_name: "Helen Adams",
    phone_number: "+254707870817",
    email: "helen.adams@example.com",
    nickname: "Helen",
    created_at: "2023-03-11T21:00:00.000Z",
    updated_at: "2023-03-11T21:00:00.000Z"
  },
  {
    id: "28",
    full_name: "Ruth Turner",
    phone_number: "+254705337103",
    email: "ruth.turner@example.com",
    nickname: "Ruth",
    created_at: "2023-03-08T21:00:00.000Z",
    updated_at: "2023-03-08T21:00:00.000Z"
  },
  {
    id: "29",
    full_name: "Jane Smith",
    phone_number: "+254705608136",
    email: "jane.smith@example.com",
    nickname: "Jane",
    created_at: "2023-06-08T21:00:00.000Z",
    updated_at: "2023-06-08T21:00:00.000Z"
  },
  {
    id: "30",
    full_name: "Betty Scott",
    phone_number: "+254704672690",
    email: "betty.scott@example.com",
    nickname: "Betty",
    created_at: "2023-05-18T21:00:00.000Z",
    updated_at: "2023-05-18T21:00:00.000Z"
  },
  {
    id: "31",
    full_name: "Edward Morris",
    phone_number: "+254707543910",
    email: "edward.morris@example.com",
    nickname: "Edward",
    created_at: "2023-01-12T21:00:00.000Z",
    updated_at: "2023-01-12T21:00:00.000Z"
  },
  {
    id: "32",
    full_name: "Daniel Anderson",
    phone_number: "+254709617929",
    email: "daniel.anderson@example.com",
    nickname: "Daniel",
    created_at: "2023-01-09T21:00:00.000Z",
    updated_at: "2023-01-09T21:00:00.000Z"
  },
  {
    id: "33",
    full_name: "Nancy Rogers",
    phone_number: "+254701171899",
    email: "nancy.rogers@example.com",
    nickname: "Nancy",
    created_at: "2023-05-08T21:00:00.000Z",
    updated_at: "2023-05-08T21:00:00.000Z"
  },
  {
    id: "34",
    full_name: "Carol Perez",
    phone_number: "+254702222381",
    email: "carol.perez@example.com",
    nickname: "Carol",
    created_at: "2023-04-09T21:00:00.000Z",
    updated_at: "2023-04-09T21:00:00.000Z"
  },
  {
    id: "35",
    full_name: "Jane Smith",
    phone_number: "+254701460184",
    email: "jane.smith@example.com",
    nickname: "Jane",
    created_at: "2023-12-22T21:00:00.000Z",
    updated_at: "2023-12-22T21:00:00.000Z"
  },
  {
    id: "36",
    full_name: "Jeffrey Cox",
    phone_number: "+254701348884",
    email: "jeffrey.cox@example.com",
    nickname: "Jeffrey",
    created_at: "2023-09-14T21:00:00.000Z",
    updated_at: "2023-09-14T21:00:00.000Z"
  },
  {
    id: "37",
    full_name: "Michael Lewis",
    phone_number: "+254704234900",
    email: "michael.lewis@example.com",
    nickname: "Michael",
    created_at: "2023-02-12T21:00:00.000Z",
    updated_at: "2023-02-12T21:00:00.000Z"
  },
  {
    id: "38",
    full_name: "Joshua Phillips",
    phone_number: "+254709741368",
    email: "joshua.phillips@example.com",
    nickname: "Joshua",
    created_at: "2023-10-14T21:00:00.000Z",
    updated_at: "2023-10-14T21:00:00.000Z"
  },
  {
    id: "39",
    full_name: "Jessica Martinez",
    phone_number: "+254707185239",
    email: "jessica.martinez@example.com",
    nickname: "Jessica",
    created_at: "2023-01-14T21:00:00.000Z",
    updated_at: "2023-01-14T21:00:00.000Z"
  },
  {
    id: "40",
    full_name: "Richard Walker",
    phone_number: "+254700883640",
    email: "richard.walker@example.com",
    nickname: "Richard",
    created_at: "2023-09-14T21:00:00.000Z",
    updated_at: "2023-09-14T21:00:00.000Z"
  },
  {
    id: "41",
    full_name: "Emily Davis",
    phone_number: "+254706127229",
    email: "emily.davis@example.com",
    nickname: "Emily",
    created_at: "2023-12-22T21:00:00.000Z",
    updated_at: "2023-12-22T21:00:00.000Z"
  },
  {
    id: "42",
    full_name: "Mike Johnson",
    phone_number: "+254702785027",
    email: "mike.johnson@example.com",
    nickname: "Mike",
    created_at: "2023-05-19T21:00:00.000Z",
    updated_at: "2023-05-19T21:00:00.000Z"
  },
  {
    id: "43",
    full_name: "Daniel Anderson",
    phone_number: "+254700498950",
    email: "daniel.anderson@example.com",
    nickname: "Daniel",
    created_at: "2023-08-17T21:00:00.000Z",
    updated_at: "2023-08-17T21:00:00.000Z"
  },
  {
    id: "44",
    full_name: "Mary Rodriguez",
    phone_number: "+254701449236",
    email: "mary.rodriguez@example.com",
    nickname: "Mary",
    created_at: "2023-10-24T21:00:00.000Z",
    updated_at: "2023-10-24T21:00:00.000Z"
  },
  {
    id: "45",
    full_name: "Kenneth Parker",
    phone_number: "+254705628396",
    email: "kenneth.parker@example.com",
    nickname: "Kenneth",
    created_at: "2023-06-22T21:00:00.000Z",
    updated_at: "2023-06-22T21:00:00.000Z"
  },
  {
    id: "46",
    full_name: "Barbara Young",
    phone_number: "+254708906491",
    email: "barbara.young@example.com",
    nickname: "Barbara",
    created_at: "2023-05-19T21:00:00.000Z",
    updated_at: "2023-05-19T21:00:00.000Z"
  },
  {
    id: "47",
    full_name: "Ronald Reed",
    phone_number: "+254705929454",
    email: "ronald.reed@example.com",
    nickname: "Ronald",
    created_at: "2023-01-03T21:00:00.000Z",
    updated_at: "2023-01-03T21:00:00.000Z"
  },
  {
    id: "48",
    full_name: "James Garcia",
    phone_number: "+254709247808",
    email: "james.garcia@example.com",
    nickname: "James",
    created_at: "2023-10-25T21:00:00.000Z",
    updated_at: "2023-10-25T21:00:00.000Z"
  },
  {
    id: "49",
    full_name: "Jessica Martinez",
    phone_number: "+254701567702",
    email: "jessica.martinez@example.com",
    nickname: "Jessica",
    created_at: "2023-07-24T21:00:00.000Z",
    updated_at: "2023-07-24T21:00:00.000Z"
  },
  {
    id: "50",
    full_name: "Dorothy Lopez",
    phone_number: "+254707659095",
    email: "dorothy.lopez@example.com",
    nickname: "Dorothy",
    created_at: "2023-06-14T21:00:00.000Z",
    updated_at: "2023-06-14T21:00:00.000Z"
  }
]


const dummyInteractions: CustomerInteraction[] = [
  {
    id: "1",
    customer_id: "1",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "89",
    points_awarded: 8,
    description: "Iced coffee and sandwich",
    created_at: "2023-06-04T13:53:00.000Z",
    updated_at: "2023-06-04T13:53:00.000Z"
  },
  {
    id: "2",
    customer_id: "1",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "383",
    points_awarded: 38,
    description: "Espresso shot",
    created_at: "2024-08-23T13:42:00.000Z",
    updated_at: "2024-08-23T13:42:00.000Z"
  },
  {
    id: "3",
    customer_id: "1",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "555",
    points_awarded: 55,
    description: "Iced coffee and sandwich",
    created_at: "2023-06-12T14:18:00.000Z",
    updated_at: "2023-06-12T14:18:00.000Z"
  },
  {
    id: "4",
    customer_id: "1",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "224",
    points_awarded: 22,
    description: "Iced coffee and sandwich",
    created_at: "2023-05-13T03:59:00.000Z",
    updated_at: "2023-05-13T03:59:00.000Z"
  },
  {
    id: "5",
    customer_id: "2",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "86",
    points_awarded: 8,
    description: "Chai latte and biscuit",
    created_at: "2023-10-27T12:40:00.000Z",
    updated_at: "2023-10-27T12:40:00.000Z"
  },
  {
    id: "6",
    customer_id: "2",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "213",
    points_awarded: 21,
    description: "Frappuccino and cookies",
    created_at: "2024-10-15T18:38:00.000Z",
    updated_at: "2024-10-15T18:38:00.000Z"
  },
  {
    id: "7",
    customer_id: "2",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "498",
    points_awarded: 49,
    description: "Americano and croissant",
    created_at: "2023-05-19T10:20:00.000Z",
    updated_at: "2023-05-19T10:20:00.000Z"
  },
  {
    id: "8",
    customer_id: "2",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "268",
    points_awarded: 26,
    description: "Espresso and muffin",
    created_at: "2023-07-05T23:06:00.000Z",
    updated_at: "2023-07-05T23:06:00.000Z"
  },
  {
    id: "9",
    customer_id: "2",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "464",
    points_awarded: 46,
    description: "Decaf coffee",
    created_at: "2024-07-28T01:14:00.000Z",
    updated_at: "2024-07-28T01:14:00.000Z"
  },
  {
    id: "10",
    customer_id: "2",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "409",
    points_awarded: 40,
    description: "Espresso shot",
    created_at: "2023-03-16T20:15:00.000Z",
    updated_at: "2023-03-16T20:15:00.000Z"
  },
  {
    id: "11",
    customer_id: "3",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "130",
    points_awarded: 13,
    description: "Breakfast combo",
    created_at: "2024-03-18T02:42:00.000Z",
    updated_at: "2024-03-18T02:42:00.000Z"
  },
  {
    id: "12",
    customer_id: "3",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "401",
    points_awarded: 40,
    description: "Tea and scones",
    created_at: "2024-04-04T19:50:00.000Z",
    updated_at: "2024-04-04T19:50:00.000Z"
  },
  {
    id: "13",
    customer_id: "3",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "200",
    points_awarded: 20,
    description: "Espresso shot",
    created_at: "2023-06-08T15:57:00.000Z",
    updated_at: "2023-06-08T15:57:00.000Z"
  },
  {
    id: "14",
    customer_id: "3",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "414",
    points_awarded: 41,
    description: "Evening treat",
    created_at: "2023-02-03T09:50:00.000Z",
    updated_at: "2023-02-03T09:50:00.000Z"
  },
  {
    id: "15",
    customer_id: "3",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "298",
    points_awarded: 29,
    description: "Breakfast combo",
    created_at: "2023-05-16T03:37:00.000Z",
    updated_at: "2023-05-16T03:37:00.000Z"
  },
  {
    id: "16",
    customer_id: "3",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "325",
    points_awarded: 32,
    description: "Breakfast combo",
    created_at: "2024-09-23T06:30:00.000Z",
    updated_at: "2024-09-23T06:30:00.000Z"
  },
  {
    id: "17",
    customer_id: "3",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "518",
    points_awarded: 51,
    description: "Breakfast combo",
    created_at: "2024-05-14T17:33:00.000Z",
    updated_at: "2024-05-14T17:33:00.000Z"
  },
  {
    id: "18",
    customer_id: "3",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "801",
    points_awarded: 80,
    description: "Specialty drink",
    created_at: "2024-03-21T23:31:00.000Z",
    updated_at: "2024-03-21T23:31:00.000Z"
  },
  {
    id: "19",
    customer_id: "3",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "650",
    points_awarded: 65,
    description: "Espresso and muffin",
    created_at: "2024-04-10T08:33:00.000Z",
    updated_at: "2024-04-10T08:33:00.000Z"
  },
  {
    id: "20",
    customer_id: "3",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "298",
    points_awarded: 29,
    description: "Team breakfast order",
    created_at: "2024-12-05T07:08:00.000Z",
    updated_at: "2024-12-05T07:08:00.000Z"
  },
  {
    id: "21",
    customer_id: "3",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "284",
    points_awarded: 28,
    description: "Cold brew and muffin",
    created_at: "2024-05-24T11:12:00.000Z",
    updated_at: "2024-05-24T11:12:00.000Z"
  },
  {
    id: "22",
    customer_id: "4",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "185",
    points_awarded: 18,
    description: "Evening treat",
    created_at: "2023-02-08T11:47:00.000Z",
    updated_at: "2023-02-08T11:47:00.000Z"
  },
  {
    id: "23",
    customer_id: "4",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "56",
    points_awarded: 5,
    description: "Cold brew and muffin",
    created_at: "2024-02-03T04:02:00.000Z",
    updated_at: "2024-02-03T04:02:00.000Z"
  },
  {
    id: "24",
    customer_id: "4",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "212",
    points_awarded: 21,
    description: "Mocha and bagel",
    created_at: "2023-03-21T18:30:00.000Z",
    updated_at: "2023-03-21T18:30:00.000Z"
  },
  {
    id: "25",
    customer_id: "4",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "256",
    points_awarded: 25,
    description: "Meeting coffee for 3",
    created_at: "2023-09-14T13:32:00.000Z",
    updated_at: "2023-09-14T13:32:00.000Z"
  },
  {
    id: "26",
    customer_id: "4",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "657",
    points_awarded: 65,
    description: "Hot chocolate and pastry",
    created_at: "2024-01-19T22:37:00.000Z",
    updated_at: "2024-01-19T22:37:00.000Z"
  },
  {
    id: "27",
    customer_id: "4",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "198",
    points_awarded: 19,
    description: "Tea and scones",
    created_at: "2023-02-01T21:24:00.000Z",
    updated_at: "2023-02-01T21:24:00.000Z"
  },
  {
    id: "28",
    customer_id: "4",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "592",
    points_awarded: 59,
    description: "Cappuccino and cake slice",
    created_at: "2024-05-04T01:14:00.000Z",
    updated_at: "2024-05-04T01:14:00.000Z"
  },
  {
    id: "29",
    customer_id: "4",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "288",
    points_awarded: 28,
    description: "Breakfast combo",
    created_at: "2024-08-20T19:56:00.000Z",
    updated_at: "2024-08-20T19:56:00.000Z"
  },
  {
    id: "30",
    customer_id: "4",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "204",
    points_awarded: 20,
    description: "Breakfast combo",
    created_at: "2024-10-25T03:28:00.000Z",
    updated_at: "2024-10-25T03:28:00.000Z"
  },
  {
    id: "31",
    customer_id: "4",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "774",
    points_awarded: 77,
    description: "Cold brew and muffin",
    created_at: "2024-05-15T23:42:00.000Z",
    updated_at: "2024-05-15T23:42:00.000Z"
  },
  {
    id: "32",
    customer_id: "4",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "403",
    points_awarded: 40,
    description: "Chai latte and biscuit",
    created_at: "2023-11-08T07:56:00.000Z",
    updated_at: "2023-11-08T07:56:00.000Z"
  },
  {
    id: "33",
    customer_id: "5",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "370",
    points_awarded: 37,
    description: "Frappuccino and cookies",
    created_at: "2023-02-10T04:23:00.000Z",
    updated_at: "2023-02-10T04:23:00.000Z"
  },
  {
    id: "34",
    customer_id: "5",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "367",
    points_awarded: 36,
    description: "Cappuccino and cake slice",
    created_at: "2023-04-20T09:10:00.000Z",
    updated_at: "2023-04-20T09:10:00.000Z"
  },
  {
    id: "35",
    customer_id: "5",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "510",
    points_awarded: 51,
    description: "Evening treat",
    created_at: "2023-08-16T00:10:00.000Z",
    updated_at: "2023-08-16T00:10:00.000Z"
  },
  {
    id: "36",
    customer_id: "5",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "463",
    points_awarded: 46,
    description: "Specialty drink",
    created_at: "2023-02-25T18:48:00.000Z",
    updated_at: "2023-02-25T18:48:00.000Z"
  },
  {
    id: "37",
    customer_id: "5",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "780",
    points_awarded: 78,
    description: "Evening treat",
    created_at: "2024-01-23T14:10:00.000Z",
    updated_at: "2024-01-23T14:10:00.000Z"
  },
  {
    id: "38",
    customer_id: "5",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "807",
    points_awarded: 80,
    description: "Coffee and pastry",
    created_at: "2023-04-12T18:50:00.000Z",
    updated_at: "2023-04-12T18:50:00.000Z"
  },
  {
    id: "39",
    customer_id: "6",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "89",
    points_awarded: 8,
    description: "Decaf coffee",
    created_at: "2023-11-24T19:46:00.000Z",
    updated_at: "2023-11-24T19:46:00.000Z"
  },
  {
    id: "40",
    customer_id: "6",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "568",
    points_awarded: 56,
    description: "Chai latte and biscuit",
    created_at: "2023-06-06T18:01:00.000Z",
    updated_at: "2023-06-06T18:01:00.000Z"
  },
  {
    id: "41",
    customer_id: "6",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "360",
    points_awarded: 36,
    description: "Frappuccino and cookies",
    created_at: "2024-09-10T14:23:00.000Z",
    updated_at: "2024-09-10T14:23:00.000Z"
  },
  {
    id: "42",
    customer_id: "7",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "187",
    points_awarded: 18,
    description: "Breakfast combo",
    created_at: "2024-04-21T06:56:00.000Z",
    updated_at: "2024-04-21T06:56:00.000Z"
  },
  {
    id: "43",
    customer_id: "7",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "843",
    points_awarded: 84,
    description: "Coffee and pastry",
    created_at: "2024-12-16T05:26:00.000Z",
    updated_at: "2024-12-16T05:26:00.000Z"
  },
  {
    id: "44",
    customer_id: "7",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "155",
    points_awarded: 15,
    description: "Cold brew and muffin",
    created_at: "2023-03-15T23:45:00.000Z",
    updated_at: "2023-03-15T23:45:00.000Z"
  },
  {
    id: "45",
    customer_id: "7",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "513",
    points_awarded: 51,
    description: "Frappuccino and cookies",
    created_at: "2024-04-16T11:47:00.000Z",
    updated_at: "2024-04-16T11:47:00.000Z"
  },
  {
    id: "46",
    customer_id: "7",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "561",
    points_awarded: 56,
    description: "Tea and scones",
    created_at: "2023-05-28T05:23:00.000Z",
    updated_at: "2023-05-28T05:23:00.000Z"
  },
  {
    id: "47",
    customer_id: "7",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "657",
    points_awarded: 65,
    description: "Decaf coffee",
    created_at: "2023-07-10T11:01:00.000Z",
    updated_at: "2023-07-10T11:01:00.000Z"
  },
  {
    id: "48",
    customer_id: "7",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "140",
    points_awarded: 14,
    description: "Afternoon snack",
    created_at: "2023-02-10T23:37:00.000Z",
    updated_at: "2023-02-10T23:37:00.000Z"
  },
  {
    id: "49",
    customer_id: "7",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "831",
    points_awarded: 83,
    description: "Cold brew and muffin",
    created_at: "2024-12-05T05:13:00.000Z",
    updated_at: "2024-12-05T05:13:00.000Z"
  },
  {
    id: "50",
    customer_id: "8",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "353",
    points_awarded: 35,
    description: "Tea and scones",
    created_at: "2023-06-04T22:38:00.000Z",
    updated_at: "2023-06-04T22:38:00.000Z"
  },
  {
    id: "51",
    customer_id: "8",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "731",
    points_awarded: 73,
    description: "Specialty drink",
    created_at: "2024-06-18T06:21:00.000Z",
    updated_at: "2024-06-18T06:21:00.000Z"
  },
  {
    id: "52",
    customer_id: "8",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "489",
    points_awarded: 48,
    description: "Breakfast combo",
    created_at: "2024-07-06T22:12:00.000Z",
    updated_at: "2024-07-06T22:12:00.000Z"
  },
  {
    id: "53",
    customer_id: "8",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "230",
    points_awarded: 23,
    description: "Espresso and muffin",
    created_at: "2023-09-28T15:53:00.000Z",
    updated_at: "2023-09-28T15:53:00.000Z"
  },
  {
    id: "54",
    customer_id: "8",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "799",
    points_awarded: 79,
    description: "Lunch special",
    created_at: "2024-11-20T02:03:00.000Z",
    updated_at: "2024-11-20T02:03:00.000Z"
  },
  {
    id: "55",
    customer_id: "9",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "628",
    points_awarded: 62,
    description: "Meeting coffee for 3",
    created_at: "2023-07-10T03:26:00.000Z",
    updated_at: "2023-07-10T03:26:00.000Z"
  },
  {
    id: "56",
    customer_id: "9",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "437",
    points_awarded: 43,
    description: "Evening treat",
    created_at: "2023-11-25T12:03:00.000Z",
    updated_at: "2023-11-25T12:03:00.000Z"
  },
  {
    id: "57",
    customer_id: "9",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "245",
    points_awarded: 24,
    description: "Afternoon snack",
    created_at: "2023-01-25T04:51:00.000Z",
    updated_at: "2023-01-25T04:51:00.000Z"
  },
  {
    id: "58",
    customer_id: "9",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "503",
    points_awarded: 50,
    description: "Espresso and muffin",
    created_at: "2023-07-22T17:53:00.000Z",
    updated_at: "2023-07-22T17:53:00.000Z"
  },
  {
    id: "59",
    customer_id: "9",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "520",
    points_awarded: 52,
    description: "Afternoon snack",
    created_at: "2024-05-26T23:02:00.000Z",
    updated_at: "2024-05-26T23:02:00.000Z"
  },
  {
    id: "60",
    customer_id: "9",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "831",
    points_awarded: 83,
    description: "Latte and sandwich",
    created_at: "2023-07-25T01:50:00.000Z",
    updated_at: "2023-07-25T01:50:00.000Z"
  },
  {
    id: "61",
    customer_id: "9",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "221",
    points_awarded: 22,
    description: "Cold brew and muffin",
    created_at: "2024-03-22T11:17:00.000Z",
    updated_at: "2024-03-22T11:17:00.000Z"
  },
  {
    id: "62",
    customer_id: "10",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "103",
    points_awarded: 10,
    description: "Espresso shot",
    created_at: "2024-06-20T22:03:00.000Z",
    updated_at: "2024-06-20T22:03:00.000Z"
  },
  {
    id: "63",
    customer_id: "10",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "610",
    points_awarded: 61,
    description: "Mocha and bagel",
    created_at: "2024-09-07T18:22:00.000Z",
    updated_at: "2024-09-07T18:22:00.000Z"
  },
  {
    id: "64",
    customer_id: "10",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "622",
    points_awarded: 62,
    description: "Meeting coffee for 3",
    created_at: "2023-11-22T01:26:00.000Z",
    updated_at: "2023-11-22T01:26:00.000Z"
  },
  {
    id: "65",
    customer_id: "10",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "606",
    points_awarded: 60,
    description: "Lunch special",
    created_at: "2023-08-05T03:53:00.000Z",
    updated_at: "2023-08-05T03:53:00.000Z"
  },
  {
    id: "66",
    customer_id: "10",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "757",
    points_awarded: 75,
    description: "Cappuccino and cake slice",
    created_at: "2023-09-26T15:10:00.000Z",
    updated_at: "2023-09-26T15:10:00.000Z"
  },
  {
    id: "67",
    customer_id: "10",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "578",
    points_awarded: 57,
    description: "Chai latte and biscuit",
    created_at: "2024-04-07T04:17:00.000Z",
    updated_at: "2024-04-07T04:17:00.000Z"
  },
  {
    id: "68",
    customer_id: "10",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "763",
    points_awarded: 76,
    description: "Frappuccino and cookies",
    created_at: "2024-10-22T18:16:00.000Z",
    updated_at: "2024-10-22T18:16:00.000Z"
  },
  {
    id: "69",
    customer_id: "10",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "122",
    points_awarded: 12,
    description: "Mocha and bagel",
    created_at: "2023-01-20T12:57:00.000Z",
    updated_at: "2023-01-20T12:57:00.000Z"
  },
  {
    id: "70",
    customer_id: "10",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "790",
    points_awarded: 79,
    description: "Tea and scones",
    created_at: "2023-09-18T01:56:00.000Z",
    updated_at: "2023-09-18T01:56:00.000Z"
  },
  {
    id: "71",
    customer_id: "10",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "375",
    points_awarded: 37,
    description: "Macchiato and donut",
    created_at: "2024-06-21T12:42:00.000Z",
    updated_at: "2024-06-21T12:42:00.000Z"
  },
  {
    id: "72",
    customer_id: "10",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "163",
    points_awarded: 16,
    description: "Americano and croissant",
    created_at: "2023-01-08T00:12:00.000Z",
    updated_at: "2023-01-08T00:12:00.000Z"
  },
  {
    id: "73",
    customer_id: "11",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "342",
    points_awarded: 34,
    description: "Decaf coffee",
    created_at: "2023-12-22T19:31:00.000Z",
    updated_at: "2023-12-22T19:31:00.000Z"
  },
  {
    id: "74",
    customer_id: "11",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "569",
    points_awarded: 56,
    description: "Tea and scones",
    created_at: "2024-06-02T01:22:00.000Z",
    updated_at: "2024-06-02T01:22:00.000Z"
  },
  {
    id: "75",
    customer_id: "11",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "87",
    points_awarded: 8,
    description: "Meeting coffee for 3",
    created_at: "2024-12-06T06:27:00.000Z",
    updated_at: "2024-12-06T06:27:00.000Z"
  },
  {
    id: "76",
    customer_id: "11",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "60",
    points_awarded: 6,
    description: "Tea and scones",
    created_at: "2023-07-18T07:25:00.000Z",
    updated_at: "2023-07-18T07:25:00.000Z"
  },
  {
    id: "77",
    customer_id: "11",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "209",
    points_awarded: 20,
    description: "Iced coffee and sandwich",
    created_at: "2024-10-25T11:00:00.000Z",
    updated_at: "2024-10-25T11:00:00.000Z"
  },
  {
    id: "78",
    customer_id: "11",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "124",
    points_awarded: 12,
    description: "Mocha and bagel",
    created_at: "2023-01-06T19:27:00.000Z",
    updated_at: "2023-01-06T19:27:00.000Z"
  },
  {
    id: "79",
    customer_id: "12",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "697",
    points_awarded: 69,
    description: "Decaf coffee",
    created_at: "2023-05-21T04:07:00.000Z",
    updated_at: "2023-05-21T04:07:00.000Z"
  },
  {
    id: "80",
    customer_id: "12",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "753",
    points_awarded: 75,
    description: "Afternoon snack",
    created_at: "2024-06-23T03:12:00.000Z",
    updated_at: "2024-06-23T03:12:00.000Z"
  },
  {
    id: "81",
    customer_id: "12",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "839",
    points_awarded: 83,
    description: "Espresso shot",
    created_at: "2024-04-03T15:49:00.000Z",
    updated_at: "2024-04-03T15:49:00.000Z"
  },
  {
    id: "82",
    customer_id: "12",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "230",
    points_awarded: 23,
    description: "Tea and scones",
    created_at: "2024-12-19T03:40:00.000Z",
    updated_at: "2024-12-19T03:40:00.000Z"
  },
  {
    id: "83",
    customer_id: "12",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "803",
    points_awarded: 80,
    description: "Macchiato and donut",
    created_at: "2023-08-03T09:37:00.000Z",
    updated_at: "2023-08-03T09:37:00.000Z"
  },
  {
    id: "84",
    customer_id: "12",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "817",
    points_awarded: 81,
    description: "Tea and scones",
    created_at: "2023-07-17T22:43:00.000Z",
    updated_at: "2023-07-17T22:43:00.000Z"
  },
  {
    id: "85",
    customer_id: "12",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "53",
    points_awarded: 5,
    description: "Specialty drink",
    created_at: "2024-09-20T00:55:00.000Z",
    updated_at: "2024-09-20T00:55:00.000Z"
  },
  {
    id: "86",
    customer_id: "13",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "733",
    points_awarded: 73,
    description: "Coffee and pastry",
    created_at: "2023-02-18T08:42:00.000Z",
    updated_at: "2023-02-18T08:42:00.000Z"
  },
  {
    id: "87",
    customer_id: "13",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "676",
    points_awarded: 67,
    description: "Chai latte and biscuit",
    created_at: "2023-01-19T03:00:00.000Z",
    updated_at: "2023-01-19T03:00:00.000Z"
  },
  {
    id: "88",
    customer_id: "13",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "289",
    points_awarded: 28,
    description: "Americano and croissant",
    created_at: "2023-11-07T08:38:00.000Z",
    updated_at: "2023-11-07T08:38:00.000Z"
  },
  {
    id: "89",
    customer_id: "13",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "94",
    points_awarded: 9,
    description: "Decaf coffee",
    created_at: "2024-10-15T22:10:00.000Z",
    updated_at: "2024-10-15T22:10:00.000Z"
  },
  {
    id: "90",
    customer_id: "13",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "375",
    points_awarded: 37,
    description: "Breakfast combo",
    created_at: "2024-05-08T17:47:00.000Z",
    updated_at: "2024-05-08T17:47:00.000Z"
  },
  {
    id: "91",
    customer_id: "13",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "310",
    points_awarded: 31,
    description: "Macchiato and donut",
    created_at: "2024-10-27T07:13:00.000Z",
    updated_at: "2024-10-27T07:13:00.000Z"
  },
  {
    id: "92",
    customer_id: "13",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "111",
    points_awarded: 11,
    description: "Frappuccino and cookies",
    created_at: "2023-10-02T20:21:00.000Z",
    updated_at: "2023-10-02T20:21:00.000Z"
  },
  {
    id: "93",
    customer_id: "13",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "641",
    points_awarded: 64,
    description: "Coffee and pastry",
    created_at: "2024-10-10T15:59:00.000Z",
    updated_at: "2024-10-10T15:59:00.000Z"
  },
  {
    id: "94",
    customer_id: "13",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "769",
    points_awarded: 76,
    description: "Hot chocolate and pastry",
    created_at: "2023-12-15T22:59:00.000Z",
    updated_at: "2023-12-15T22:59:00.000Z"
  },
  {
    id: "95",
    customer_id: "14",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "287",
    points_awarded: 28,
    description: "Specialty drink",
    created_at: "2023-05-18T02:57:00.000Z",
    updated_at: "2023-05-18T02:57:00.000Z"
  },
  {
    id: "96",
    customer_id: "14",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "814",
    points_awarded: 81,
    description: "Cold brew and muffin",
    created_at: "2024-04-26T03:19:00.000Z",
    updated_at: "2024-04-26T03:19:00.000Z"
  },
  {
    id: "97",
    customer_id: "14",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "218",
    points_awarded: 21,
    description: "Decaf coffee",
    created_at: "2023-02-27T03:39:00.000Z",
    updated_at: "2023-02-27T03:39:00.000Z"
  },
  {
    id: "98",
    customer_id: "14",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "616",
    points_awarded: 61,
    description: "Specialty drink",
    created_at: "2024-05-28T12:18:00.000Z",
    updated_at: "2024-05-28T12:18:00.000Z"
  },
  {
    id: "99",
    customer_id: "14",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "843",
    points_awarded: 84,
    description: "Espresso shot",
    created_at: "2023-02-05T06:21:00.000Z",
    updated_at: "2023-02-05T06:21:00.000Z"
  },
  {
    id: "100",
    customer_id: "14",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "413",
    points_awarded: 41,
    description: "Team breakfast order",
    created_at: "2023-01-26T08:58:00.000Z",
    updated_at: "2023-01-26T08:58:00.000Z"
  },
  {
    id: "101",
    customer_id: "14",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "324",
    points_awarded: 32,
    description: "Espresso shot",
    created_at: "2024-08-24T19:13:00.000Z",
    updated_at: "2024-08-24T19:13:00.000Z"
  },
  {
    id: "102",
    customer_id: "14",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "624",
    points_awarded: 62,
    description: "Afternoon snack",
    created_at: "2023-03-24T01:53:00.000Z",
    updated_at: "2023-03-24T01:53:00.000Z"
  },
  {
    id: "103",
    customer_id: "14",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "575",
    points_awarded: 57,
    description: "Chai latte and biscuit",
    created_at: "2023-09-16T05:34:00.000Z",
    updated_at: "2023-09-16T05:34:00.000Z"
  },
  {
    id: "104",
    customer_id: "14",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "258",
    points_awarded: 25,
    description: "Espresso and muffin",
    created_at: "2024-12-07T20:07:00.000Z",
    updated_at: "2024-12-07T20:07:00.000Z"
  },
  {
    id: "105",
    customer_id: "15",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "266",
    points_awarded: 26,
    description: "Meeting coffee for 3",
    created_at: "2024-02-10T17:06:00.000Z",
    updated_at: "2024-02-10T17:06:00.000Z"
  },
  {
    id: "106",
    customer_id: "15",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "370",
    points_awarded: 37,
    description: "Cappuccino and cake slice",
    created_at: "2024-01-10T18:09:00.000Z",
    updated_at: "2024-01-10T18:09:00.000Z"
  },
  {
    id: "107",
    customer_id: "15",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "749",
    points_awarded: 74,
    description: "Lunch special",
    created_at: "2023-12-18T17:13:00.000Z",
    updated_at: "2023-12-18T17:13:00.000Z"
  },
  {
    id: "108",
    customer_id: "15",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "199",
    points_awarded: 19,
    description: "Lunch special",
    created_at: "2023-07-02T02:41:00.000Z",
    updated_at: "2023-07-02T02:41:00.000Z"
  },
  {
    id: "109",
    customer_id: "16",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "827",
    points_awarded: 82,
    description: "Cappuccino and cake slice",
    created_at: "2024-04-14T12:04:00.000Z",
    updated_at: "2024-04-14T12:04:00.000Z"
  },
  {
    id: "110",
    customer_id: "16",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "340",
    points_awarded: 34,
    description: "Chai latte and biscuit",
    created_at: "2023-04-24T07:07:00.000Z",
    updated_at: "2023-04-24T07:07:00.000Z"
  },
  {
    id: "111",
    customer_id: "16",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "659",
    points_awarded: 65,
    description: "Iced coffee and sandwich",
    created_at: "2024-04-01T21:55:00.000Z",
    updated_at: "2024-04-01T21:55:00.000Z"
  },
  {
    id: "112",
    customer_id: "16",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "792",
    points_awarded: 79,
    description: "Americano and croissant",
    created_at: "2023-07-26T17:11:00.000Z",
    updated_at: "2023-07-26T17:11:00.000Z"
  },
  {
    id: "113",
    customer_id: "16",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "785",
    points_awarded: 78,
    description: "Cappuccino and cake slice",
    created_at: "2024-11-03T23:11:00.000Z",
    updated_at: "2024-11-03T23:11:00.000Z"
  },
  {
    id: "114",
    customer_id: "16",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "497",
    points_awarded: 49,
    description: "Macchiato and donut",
    created_at: "2024-12-07T15:33:00.000Z",
    updated_at: "2024-12-07T15:33:00.000Z"
  },
  {
    id: "115",
    customer_id: "16",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "671",
    points_awarded: 67,
    description: "Mocha and bagel",
    created_at: "2024-05-15T01:59:00.000Z",
    updated_at: "2024-05-15T01:59:00.000Z"
  },
  {
    id: "116",
    customer_id: "16",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "450",
    points_awarded: 45,
    description: "Lunch special",
    created_at: "2023-09-13T20:42:00.000Z",
    updated_at: "2023-09-13T20:42:00.000Z"
  },
  {
    id: "117",
    customer_id: "16",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "780",
    points_awarded: 78,
    description: "Decaf coffee",
    created_at: "2024-09-11T00:35:00.000Z",
    updated_at: "2024-09-11T00:35:00.000Z"
  },
  {
    id: "118",
    customer_id: "16",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "53",
    points_awarded: 5,
    description: "Latte and sandwich",
    created_at: "2024-08-17T18:06:00.000Z",
    updated_at: "2024-08-17T18:06:00.000Z"
  },
  {
    id: "119",
    customer_id: "17",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "601",
    points_awarded: 60,
    description: "Americano and croissant",
    created_at: "2024-01-02T22:18:00.000Z",
    updated_at: "2024-01-02T22:18:00.000Z"
  },
  {
    id: "120",
    customer_id: "17",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "256",
    points_awarded: 25,
    description: "Cappuccino and cake slice",
    created_at: "2023-06-24T04:46:00.000Z",
    updated_at: "2023-06-24T04:46:00.000Z"
  },
  {
    id: "121",
    customer_id: "17",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "109",
    points_awarded: 10,
    description: "Team breakfast order",
    created_at: "2023-12-27T05:33:00.000Z",
    updated_at: "2023-12-27T05:33:00.000Z"
  },
  {
    id: "122",
    customer_id: "17",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "245",
    points_awarded: 24,
    description: "Lunch special",
    created_at: "2023-05-05T05:55:00.000Z",
    updated_at: "2023-05-05T05:55:00.000Z"
  },
  {
    id: "123",
    customer_id: "17",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "671",
    points_awarded: 67,
    description: "Breakfast combo",
    created_at: "2023-03-07T20:12:00.000Z",
    updated_at: "2023-03-07T20:12:00.000Z"
  },
  {
    id: "124",
    customer_id: "17",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "759",
    points_awarded: 75,
    description: "Breakfast combo",
    created_at: "2024-08-24T12:09:00.000Z",
    updated_at: "2024-08-24T12:09:00.000Z"
  },
  {
    id: "125",
    customer_id: "17",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "170",
    points_awarded: 17,
    description: "Iced coffee and sandwich",
    created_at: "2024-06-11T14:49:00.000Z",
    updated_at: "2024-06-11T14:49:00.000Z"
  },
  {
    id: "126",
    customer_id: "17",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "351",
    points_awarded: 35,
    description: "Latte and sandwich",
    created_at: "2023-03-04T17:29:00.000Z",
    updated_at: "2023-03-04T17:29:00.000Z"
  },
  {
    id: "127",
    customer_id: "17",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "759",
    points_awarded: 75,
    description: "Specialty drink",
    created_at: "2024-12-01T02:22:00.000Z",
    updated_at: "2024-12-01T02:22:00.000Z"
  },
  {
    id: "128",
    customer_id: "17",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "267",
    points_awarded: 26,
    description: "Iced coffee and sandwich",
    created_at: "2023-11-04T13:19:00.000Z",
    updated_at: "2023-11-04T13:19:00.000Z"
  },
  {
    id: "129",
    customer_id: "18",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "687",
    points_awarded: 68,
    description: "Americano and croissant",
    created_at: "2024-08-11T10:58:00.000Z",
    updated_at: "2024-08-11T10:58:00.000Z"
  },
  {
    id: "130",
    customer_id: "18",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "642",
    points_awarded: 64,
    description: "Breakfast combo",
    created_at: "2023-08-03T13:27:00.000Z",
    updated_at: "2023-08-03T13:27:00.000Z"
  },
  {
    id: "131",
    customer_id: "19",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "324",
    points_awarded: 32,
    description: "Chai latte and biscuit",
    created_at: "2024-03-22T08:41:00.000Z",
    updated_at: "2024-03-22T08:41:00.000Z"
  },
  {
    id: "132",
    customer_id: "19",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "822",
    points_awarded: 82,
    description: "Evening treat",
    created_at: "2023-05-14T00:14:00.000Z",
    updated_at: "2023-05-14T00:14:00.000Z"
  },
  {
    id: "133",
    customer_id: "20",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "524",
    points_awarded: 52,
    description: "Espresso and muffin",
    created_at: "2024-08-26T13:03:00.000Z",
    updated_at: "2024-08-26T13:03:00.000Z"
  },
  {
    id: "134",
    customer_id: "20",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "314",
    points_awarded: 31,
    description: "Macchiato and donut",
    created_at: "2023-06-03T03:39:00.000Z",
    updated_at: "2023-06-03T03:39:00.000Z"
  },
  {
    id: "135",
    customer_id: "20",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "246",
    points_awarded: 24,
    description: "Espresso and muffin",
    created_at: "2023-08-07T11:54:00.000Z",
    updated_at: "2023-08-07T11:54:00.000Z"
  },
  {
    id: "136",
    customer_id: "20",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "156",
    points_awarded: 15,
    description: "Meeting coffee for 3",
    created_at: "2023-07-04T15:55:00.000Z",
    updated_at: "2023-07-04T15:55:00.000Z"
  },
  {
    id: "137",
    customer_id: "20",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "130",
    points_awarded: 13,
    description: "Mocha and bagel",
    created_at: "2023-05-10T09:24:00.000Z",
    updated_at: "2023-05-10T09:24:00.000Z"
  },
  {
    id: "138",
    customer_id: "21",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "181",
    points_awarded: 18,
    description: "Espresso shot",
    created_at: "2023-06-15T21:36:00.000Z",
    updated_at: "2023-06-15T21:36:00.000Z"
  },
  {
    id: "139",
    customer_id: "21",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "254",
    points_awarded: 25,
    description: "Espresso shot",
    created_at: "2023-12-22T23:06:00.000Z",
    updated_at: "2023-12-22T23:06:00.000Z"
  },
  {
    id: "140",
    customer_id: "21",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "586",
    points_awarded: 58,
    description: "Iced coffee and sandwich",
    created_at: "2024-01-28T12:11:00.000Z",
    updated_at: "2024-01-28T12:11:00.000Z"
  },
  {
    id: "141",
    customer_id: "22",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "820",
    points_awarded: 82,
    description: "Evening treat",
    created_at: "2023-06-06T14:55:00.000Z",
    updated_at: "2023-06-06T14:55:00.000Z"
  },
  {
    id: "142",
    customer_id: "22",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "734",
    points_awarded: 73,
    description: "Cold brew and muffin",
    created_at: "2024-07-18T02:11:00.000Z",
    updated_at: "2024-07-18T02:11:00.000Z"
  },
  {
    id: "143",
    customer_id: "22",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "594",
    points_awarded: 59,
    description: "Iced coffee and sandwich",
    created_at: "2023-04-03T03:16:00.000Z",
    updated_at: "2023-04-03T03:16:00.000Z"
  },
  {
    id: "144",
    customer_id: "22",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "558",
    points_awarded: 55,
    description: "Breakfast combo",
    created_at: "2024-10-01T21:19:00.000Z",
    updated_at: "2024-10-01T21:19:00.000Z"
  },
  {
    id: "145",
    customer_id: "22",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "204",
    points_awarded: 20,
    description: "Afternoon snack",
    created_at: "2024-02-14T20:50:00.000Z",
    updated_at: "2024-02-14T20:50:00.000Z"
  },
  {
    id: "146",
    customer_id: "23",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "550",
    points_awarded: 55,
    description: "Latte and sandwich",
    created_at: "2023-02-09T01:08:00.000Z",
    updated_at: "2023-02-09T01:08:00.000Z"
  },
  {
    id: "147",
    customer_id: "23",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "274",
    points_awarded: 27,
    description: "Afternoon snack",
    created_at: "2023-03-11T09:30:00.000Z",
    updated_at: "2023-03-11T09:30:00.000Z"
  },
  {
    id: "148",
    customer_id: "23",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "170",
    points_awarded: 17,
    description: "Americano and croissant",
    created_at: "2024-03-25T23:58:00.000Z",
    updated_at: "2024-03-25T23:58:00.000Z"
  },
  {
    id: "149",
    customer_id: "24",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "181",
    points_awarded: 18,
    description: "Coffee and pastry",
    created_at: "2024-02-02T22:48:00.000Z",
    updated_at: "2024-02-02T22:48:00.000Z"
  },
  {
    id: "150",
    customer_id: "24",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "796",
    points_awarded: 79,
    description: "Tea and scones",
    created_at: "2024-05-11T17:23:00.000Z",
    updated_at: "2024-05-11T17:23:00.000Z"
  },
  {
    id: "151",
    customer_id: "24",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "588",
    points_awarded: 58,
    description: "Evening treat",
    created_at: "2023-04-12T23:53:00.000Z",
    updated_at: "2023-04-12T23:53:00.000Z"
  },
  {
    id: "152",
    customer_id: "24",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "209",
    points_awarded: 20,
    description: "Decaf coffee",
    created_at: "2024-08-08T13:21:00.000Z",
    updated_at: "2024-08-08T13:21:00.000Z"
  },
  {
    id: "153",
    customer_id: "24",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "571",
    points_awarded: 57,
    description: "Cappuccino and cake slice",
    created_at: "2023-12-06T09:57:00.000Z",
    updated_at: "2023-12-06T09:57:00.000Z"
  },
  {
    id: "154",
    customer_id: "24",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "560",
    points_awarded: 56,
    description: "Chai latte and biscuit",
    created_at: "2024-11-07T13:03:00.000Z",
    updated_at: "2024-11-07T13:03:00.000Z"
  },
  {
    id: "155",
    customer_id: "25",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "422",
    points_awarded: 42,
    description: "Macchiato and donut",
    created_at: "2023-05-03T22:43:00.000Z",
    updated_at: "2023-05-03T22:43:00.000Z"
  },
  {
    id: "156",
    customer_id: "25",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "567",
    points_awarded: 56,
    description: "Americano and croissant",
    created_at: "2023-03-27T20:37:00.000Z",
    updated_at: "2023-03-27T20:37:00.000Z"
  },
  {
    id: "157",
    customer_id: "25",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "112",
    points_awarded: 11,
    description: "Lunch special",
    created_at: "2023-11-03T22:40:00.000Z",
    updated_at: "2023-11-03T22:40:00.000Z"
  },
  {
    id: "158",
    customer_id: "26",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "237",
    points_awarded: 23,
    description: "Team breakfast order",
    created_at: "2024-11-10T02:26:00.000Z",
    updated_at: "2024-11-10T02:26:00.000Z"
  },
  {
    id: "159",
    customer_id: "26",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "153",
    points_awarded: 15,
    description: "Espresso and muffin",
    created_at: "2024-12-26T16:29:00.000Z",
    updated_at: "2024-12-26T16:29:00.000Z"
  },
  {
    id: "160",
    customer_id: "27",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "740",
    points_awarded: 74,
    description: "Chai latte and biscuit",
    created_at: "2023-10-19T09:27:00.000Z",
    updated_at: "2023-10-19T09:27:00.000Z"
  },
  {
    id: "161",
    customer_id: "27",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "286",
    points_awarded: 28,
    description: "Afternoon snack",
    created_at: "2023-11-21T06:52:00.000Z",
    updated_at: "2023-11-21T06:52:00.000Z"
  },
  {
    id: "162",
    customer_id: "27",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "390",
    points_awarded: 39,
    description: "Frappuccino and cookies",
    created_at: "2024-11-12T11:40:00.000Z",
    updated_at: "2024-11-12T11:40:00.000Z"
  },
  {
    id: "163",
    customer_id: "27",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "511",
    points_awarded: 51,
    description: "Mocha and bagel",
    created_at: "2023-09-06T13:13:00.000Z",
    updated_at: "2023-09-06T13:13:00.000Z"
  },
  {
    id: "164",
    customer_id: "27",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "181",
    points_awarded: 18,
    description: "Meeting coffee for 3",
    created_at: "2023-12-14T01:36:00.000Z",
    updated_at: "2023-12-14T01:36:00.000Z"
  },
  {
    id: "165",
    customer_id: "27",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "826",
    points_awarded: 82,
    description: "Americano and croissant",
    created_at: "2024-12-15T19:47:00.000Z",
    updated_at: "2024-12-15T19:47:00.000Z"
  },
  {
    id: "166",
    customer_id: "27",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "169",
    points_awarded: 16,
    description: "Latte and sandwich",
    created_at: "2024-11-02T23:41:00.000Z",
    updated_at: "2024-11-02T23:41:00.000Z"
  },
  {
    id: "167",
    customer_id: "27",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "252",
    points_awarded: 25,
    description: "Americano and croissant",
    created_at: "2024-11-02T17:02:00.000Z",
    updated_at: "2024-11-02T17:02:00.000Z"
  },
  {
    id: "168",
    customer_id: "27",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "633",
    points_awarded: 63,
    description: "Latte and sandwich",
    created_at: "2024-09-26T17:22:00.000Z",
    updated_at: "2024-09-26T17:22:00.000Z"
  },
  {
    id: "169",
    customer_id: "28",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "406",
    points_awarded: 40,
    description: "Team breakfast order",
    created_at: "2023-05-14T19:03:00.000Z",
    updated_at: "2023-05-14T19:03:00.000Z"
  },
  {
    id: "170",
    customer_id: "28",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "845",
    points_awarded: 84,
    description: "Cappuccino and cake slice",
    created_at: "2023-01-06T05:38:00.000Z",
    updated_at: "2023-01-06T05:38:00.000Z"
  },
  {
    id: "171",
    customer_id: "28",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "455",
    points_awarded: 45,
    description: "Meeting coffee for 3",
    created_at: "2023-11-09T22:29:00.000Z",
    updated_at: "2023-11-09T22:29:00.000Z"
  },
  {
    id: "172",
    customer_id: "28",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "237",
    points_awarded: 23,
    description: "Hot chocolate and pastry",
    created_at: "2024-06-13T05:58:00.000Z",
    updated_at: "2024-06-13T05:58:00.000Z"
  },
  {
    id: "173",
    customer_id: "28",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "249",
    points_awarded: 24,
    description: "Iced coffee and sandwich",
    created_at: "2023-05-05T14:52:00.000Z",
    updated_at: "2023-05-05T14:52:00.000Z"
  },
  {
    id: "174",
    customer_id: "28",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "532",
    points_awarded: 53,
    description: "Cappuccino and cake slice",
    created_at: "2024-03-09T07:39:00.000Z",
    updated_at: "2024-03-09T07:39:00.000Z"
  },
  {
    id: "175",
    customer_id: "28",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "294",
    points_awarded: 29,
    description: "Breakfast combo",
    created_at: "2023-05-04T19:13:00.000Z",
    updated_at: "2023-05-04T19:13:00.000Z"
  },
  {
    id: "176",
    customer_id: "28",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "742",
    points_awarded: 74,
    description: "Specialty drink",
    created_at: "2024-06-03T19:00:00.000Z",
    updated_at: "2024-06-03T19:00:00.000Z"
  },
  {
    id: "177",
    customer_id: "28",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "161",
    points_awarded: 16,
    description: "Evening treat",
    created_at: "2023-10-22T16:01:00.000Z",
    updated_at: "2023-10-22T16:01:00.000Z"
  },
  {
    id: "178",
    customer_id: "28",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "770",
    points_awarded: 77,
    description: "Chai latte and biscuit",
    created_at: "2024-10-20T22:31:00.000Z",
    updated_at: "2024-10-20T22:31:00.000Z"
  },
  {
    id: "179",
    customer_id: "29",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "825",
    points_awarded: 82,
    description: "Decaf coffee",
    created_at: "2023-04-27T07:17:00.000Z",
    updated_at: "2023-04-27T07:17:00.000Z"
  },
  {
    id: "180",
    customer_id: "29",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "587",
    points_awarded: 58,
    description: "Cold brew and muffin",
    created_at: "2024-02-13T20:33:00.000Z",
    updated_at: "2024-02-13T20:33:00.000Z"
  },
  {
    id: "181",
    customer_id: "29",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "563",
    points_awarded: 56,
    description: "Decaf coffee",
    created_at: "2023-04-23T17:11:00.000Z",
    updated_at: "2023-04-23T17:11:00.000Z"
  },
  {
    id: "182",
    customer_id: "29",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "492",
    points_awarded: 49,
    description: "Specialty drink",
    created_at: "2023-05-10T21:41:00.000Z",
    updated_at: "2023-05-10T21:41:00.000Z"
  },
  {
    id: "183",
    customer_id: "29",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "258",
    points_awarded: 25,
    description: "Hot chocolate and pastry",
    created_at: "2023-02-17T10:01:00.000Z",
    updated_at: "2023-02-17T10:01:00.000Z"
  },
  {
    id: "184",
    customer_id: "29",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "440",
    points_awarded: 44,
    description: "Meeting coffee for 3",
    created_at: "2023-09-07T08:44:00.000Z",
    updated_at: "2023-09-07T08:44:00.000Z"
  },
  {
    id: "185",
    customer_id: "29",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "661",
    points_awarded: 66,
    description: "Breakfast combo",
    created_at: "2023-10-17T11:53:00.000Z",
    updated_at: "2023-10-17T11:53:00.000Z"
  },
  {
    id: "186",
    customer_id: "29",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "158",
    points_awarded: 15,
    description: "Mocha and bagel",
    created_at: "2024-04-05T06:14:00.000Z",
    updated_at: "2024-04-05T06:14:00.000Z"
  },
  {
    id: "187",
    customer_id: "29",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "293",
    points_awarded: 29,
    description: "Tea and scones",
    created_at: "2024-06-22T00:19:00.000Z",
    updated_at: "2024-06-22T00:19:00.000Z"
  },
  {
    id: "188",
    customer_id: "29",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "664",
    points_awarded: 66,
    description: "Americano and croissant",
    created_at: "2024-07-26T04:25:00.000Z",
    updated_at: "2024-07-26T04:25:00.000Z"
  },
  {
    id: "189",
    customer_id: "30",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "103",
    points_awarded: 10,
    description: "Espresso and muffin",
    created_at: "2023-06-24T02:52:00.000Z",
    updated_at: "2023-06-24T02:52:00.000Z"
  },
  {
    id: "190",
    customer_id: "30",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "325",
    points_awarded: 32,
    description: "Frappuccino and cookies",
    created_at: "2024-10-18T07:40:00.000Z",
    updated_at: "2024-10-18T07:40:00.000Z"
  },
  {
    id: "191",
    customer_id: "30",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "284",
    points_awarded: 28,
    description: "Team breakfast order",
    created_at: "2024-10-23T09:47:00.000Z",
    updated_at: "2024-10-23T09:47:00.000Z"
  },
  {
    id: "192",
    customer_id: "31",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "807",
    points_awarded: 80,
    description: "Americano and croissant",
    created_at: "2024-04-11T03:15:00.000Z",
    updated_at: "2024-04-11T03:15:00.000Z"
  },
  {
    id: "193",
    customer_id: "31",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "453",
    points_awarded: 45,
    description: "Cold brew and muffin",
    created_at: "2024-09-14T23:02:00.000Z",
    updated_at: "2024-09-14T23:02:00.000Z"
  },
  {
    id: "194",
    customer_id: "31",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "351",
    points_awarded: 35,
    description: "Chai latte and biscuit",
    created_at: "2023-10-10T08:16:00.000Z",
    updated_at: "2023-10-10T08:16:00.000Z"
  },
  {
    id: "195",
    customer_id: "31",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "705",
    points_awarded: 70,
    description: "Chai latte and biscuit",
    created_at: "2024-06-18T01:20:00.000Z",
    updated_at: "2024-06-18T01:20:00.000Z"
  },
  {
    id: "196",
    customer_id: "32",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "579",
    points_awarded: 57,
    description: "Cold brew and muffin",
    created_at: "2024-04-26T10:04:00.000Z",
    updated_at: "2024-04-26T10:04:00.000Z"
  },
  {
    id: "197",
    customer_id: "32",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "472",
    points_awarded: 47,
    description: "Cold brew and muffin",
    created_at: "2024-06-24T15:27:00.000Z",
    updated_at: "2024-06-24T15:27:00.000Z"
  },
  {
    id: "198",
    customer_id: "32",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "156",
    points_awarded: 15,
    description: "Breakfast combo",
    created_at: "2024-12-14T02:56:00.000Z",
    updated_at: "2024-12-14T02:56:00.000Z"
  },
  {
    id: "199",
    customer_id: "32",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "281",
    points_awarded: 28,
    description: "Iced coffee and sandwich",
    created_at: "2024-05-01T06:22:00.000Z",
    updated_at: "2024-05-01T06:22:00.000Z"
  },
  {
    id: "200",
    customer_id: "32",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "794",
    points_awarded: 79,
    description: "Espresso and muffin",
    created_at: "2023-07-22T09:00:00.000Z",
    updated_at: "2023-07-22T09:00:00.000Z"
  },
  {
    id: "201",
    customer_id: "32",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "798",
    points_awarded: 79,
    description: "Meeting coffee for 3",
    created_at: "2023-07-02T22:21:00.000Z",
    updated_at: "2023-07-02T22:21:00.000Z"
  },
  {
    id: "202",
    customer_id: "33",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "694",
    points_awarded: 69,
    description: "Frappuccino and cookies",
    created_at: "2024-06-23T03:20:00.000Z",
    updated_at: "2024-06-23T03:20:00.000Z"
  },
  {
    id: "203",
    customer_id: "33",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "469",
    points_awarded: 46,
    description: "Cold brew and muffin",
    created_at: "2024-12-24T15:46:00.000Z",
    updated_at: "2024-12-24T15:46:00.000Z"
  },
  {
    id: "204",
    customer_id: "33",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "87",
    points_awarded: 8,
    description: "Breakfast combo",
    created_at: "2024-07-03T16:07:00.000Z",
    updated_at: "2024-07-03T16:07:00.000Z"
  },
  {
    id: "205",
    customer_id: "33",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "560",
    points_awarded: 56,
    description: "Afternoon snack",
    created_at: "2023-12-28T14:54:00.000Z",
    updated_at: "2023-12-28T14:54:00.000Z"
  },
  {
    id: "206",
    customer_id: "33",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "92",
    points_awarded: 9,
    description: "Specialty drink",
    created_at: "2024-10-04T12:35:00.000Z",
    updated_at: "2024-10-04T12:35:00.000Z"
  },
  {
    id: "207",
    customer_id: "33",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "670",
    points_awarded: 67,
    description: "Frappuccino and cookies",
    created_at: "2023-04-28T06:47:00.000Z",
    updated_at: "2023-04-28T06:47:00.000Z"
  },
  {
    id: "208",
    customer_id: "33",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "495",
    points_awarded: 49,
    description: "Mocha and bagel",
    created_at: "2023-03-24T23:03:00.000Z",
    updated_at: "2023-03-24T23:03:00.000Z"
  },
  {
    id: "209",
    customer_id: "33",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "433",
    points_awarded: 43,
    description: "Afternoon snack",
    created_at: "2024-06-19T21:06:00.000Z",
    updated_at: "2024-06-19T21:06:00.000Z"
  },
  {
    id: "210",
    customer_id: "33",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "631",
    points_awarded: 63,
    description: "Tea and scones",
    created_at: "2024-04-11T08:32:00.000Z",
    updated_at: "2024-04-11T08:32:00.000Z"
  },
  {
    id: "211",
    customer_id: "33",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "134",
    points_awarded: 13,
    description: "Afternoon snack",
    created_at: "2024-08-23T06:46:00.000Z",
    updated_at: "2024-08-23T06:46:00.000Z"
  },
  {
    id: "212",
    customer_id: "34",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "225",
    points_awarded: 22,
    description: "Frappuccino and cookies",
    created_at: "2023-12-23T11:47:00.000Z",
    updated_at: "2023-12-23T11:47:00.000Z"
  },
  {
    id: "213",
    customer_id: "34",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "206",
    points_awarded: 20,
    description: "Hot chocolate and pastry",
    created_at: "2024-10-10T00:35:00.000Z",
    updated_at: "2024-10-10T00:35:00.000Z"
  },
  {
    id: "214",
    customer_id: "34",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "94",
    points_awarded: 9,
    description: "Lunch special",
    created_at: "2024-05-26T17:40:00.000Z",
    updated_at: "2024-05-26T17:40:00.000Z"
  },
  {
    id: "215",
    customer_id: "34",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "464",
    points_awarded: 46,
    description: "Latte and sandwich",
    created_at: "2023-08-17T04:33:00.000Z",
    updated_at: "2023-08-17T04:33:00.000Z"
  },
  {
    id: "216",
    customer_id: "34",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "755",
    points_awarded: 75,
    description: "Evening treat",
    created_at: "2023-03-16T20:35:00.000Z",
    updated_at: "2023-03-16T20:35:00.000Z"
  },
  {
    id: "217",
    customer_id: "34",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "154",
    points_awarded: 15,
    description: "Mocha and bagel",
    created_at: "2023-12-08T10:08:00.000Z",
    updated_at: "2023-12-08T10:08:00.000Z"
  },
  {
    id: "218",
    customer_id: "34",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "344",
    points_awarded: 34,
    description: "Tea and scones",
    created_at: "2023-01-04T07:57:00.000Z",
    updated_at: "2023-01-04T07:57:00.000Z"
  },
  {
    id: "219",
    customer_id: "34",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "93",
    points_awarded: 9,
    description: "Hot chocolate and pastry",
    created_at: "2024-11-03T18:22:00.000Z",
    updated_at: "2024-11-03T18:22:00.000Z"
  },
  {
    id: "220",
    customer_id: "35",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "89",
    points_awarded: 8,
    description: "Americano and croissant",
    created_at: "2023-01-02T20:29:00.000Z",
    updated_at: "2023-01-02T20:29:00.000Z"
  },
  {
    id: "221",
    customer_id: "35",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "306",
    points_awarded: 30,
    description: "Iced coffee and sandwich",
    created_at: "2023-11-07T16:59:00.000Z",
    updated_at: "2023-11-07T16:59:00.000Z"
  },
  {
    id: "222",
    customer_id: "35",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "344",
    points_awarded: 34,
    description: "Macchiato and donut",
    created_at: "2024-03-06T01:08:00.000Z",
    updated_at: "2024-03-06T01:08:00.000Z"
  },
  {
    id: "223",
    customer_id: "35",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "163",
    points_awarded: 16,
    description: "Decaf coffee",
    created_at: "2023-02-16T16:59:00.000Z",
    updated_at: "2023-02-16T16:59:00.000Z"
  },
  {
    id: "224",
    customer_id: "35",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "485",
    points_awarded: 48,
    description: "Team breakfast order",
    created_at: "2023-11-23T15:06:00.000Z",
    updated_at: "2023-11-23T15:06:00.000Z"
  },
  {
    id: "225",
    customer_id: "35",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "690",
    points_awarded: 69,
    description: "Cappuccino and cake slice",
    created_at: "2024-10-04T19:56:00.000Z",
    updated_at: "2024-10-04T19:56:00.000Z"
  },
  {
    id: "226",
    customer_id: "35",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "781",
    points_awarded: 78,
    description: "Chai latte and biscuit",
    created_at: "2023-06-17T16:38:00.000Z",
    updated_at: "2023-06-17T16:38:00.000Z"
  },
  {
    id: "227",
    customer_id: "36",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "313",
    points_awarded: 31,
    description: "Latte and sandwich",
    created_at: "2023-08-07T17:56:00.000Z",
    updated_at: "2023-08-07T17:56:00.000Z"
  },
  {
    id: "228",
    customer_id: "36",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "486",
    points_awarded: 48,
    description: "Macchiato and donut",
    created_at: "2024-12-01T07:07:00.000Z",
    updated_at: "2024-12-01T07:07:00.000Z"
  },
  {
    id: "229",
    customer_id: "36",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "509",
    points_awarded: 50,
    description: "Iced coffee and sandwich",
    created_at: "2024-07-26T22:00:00.000Z",
    updated_at: "2024-07-26T22:00:00.000Z"
  },
  {
    id: "230",
    customer_id: "36",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "138",
    points_awarded: 13,
    description: "Coffee and pastry",
    created_at: "2024-06-12T12:55:00.000Z",
    updated_at: "2024-06-12T12:55:00.000Z"
  },
  {
    id: "231",
    customer_id: "37",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "697",
    points_awarded: 69,
    description: "Hot chocolate and pastry",
    created_at: "2024-03-18T00:05:00.000Z",
    updated_at: "2024-03-18T00:05:00.000Z"
  },
  {
    id: "232",
    customer_id: "37",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "416",
    points_awarded: 41,
    description: "Specialty drink",
    created_at: "2024-11-09T15:22:00.000Z",
    updated_at: "2024-11-09T15:22:00.000Z"
  },
  {
    id: "233",
    customer_id: "37",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "546",
    points_awarded: 54,
    description: "Cappuccino and cake slice",
    created_at: "2024-01-04T10:34:00.000Z",
    updated_at: "2024-01-04T10:34:00.000Z"
  },
  {
    id: "234",
    customer_id: "37",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "614",
    points_awarded: 61,
    description: "Iced coffee and sandwich",
    created_at: "2024-07-02T23:28:00.000Z",
    updated_at: "2024-07-02T23:28:00.000Z"
  },
  {
    id: "235",
    customer_id: "37",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "681",
    points_awarded: 68,
    description: "Tea and scones",
    created_at: "2024-07-25T11:49:00.000Z",
    updated_at: "2024-07-25T11:49:00.000Z"
  },
  {
    id: "236",
    customer_id: "37",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "414",
    points_awarded: 41,
    description: "Lunch special",
    created_at: "2023-06-08T08:39:00.000Z",
    updated_at: "2023-06-08T08:39:00.000Z"
  },
  {
    id: "237",
    customer_id: "37",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "120",
    points_awarded: 12,
    description: "Espresso shot",
    created_at: "2023-07-16T16:01:00.000Z",
    updated_at: "2023-07-16T16:01:00.000Z"
  },
  {
    id: "238",
    customer_id: "37",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "782",
    points_awarded: 78,
    description: "Cold brew and muffin",
    created_at: "2023-11-10T00:39:00.000Z",
    updated_at: "2023-11-10T00:39:00.000Z"
  },
  {
    id: "239",
    customer_id: "37",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "381",
    points_awarded: 38,
    description: "Lunch special",
    created_at: "2024-12-06T19:56:00.000Z",
    updated_at: "2024-12-06T19:56:00.000Z"
  },
  {
    id: "240",
    customer_id: "37",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "104",
    points_awarded: 10,
    description: "Espresso shot",
    created_at: "2023-07-22T04:30:00.000Z",
    updated_at: "2023-07-22T04:30:00.000Z"
  },
  {
    id: "241",
    customer_id: "38",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "639",
    points_awarded: 63,
    description: "Latte and sandwich",
    created_at: "2023-04-21T03:02:00.000Z",
    updated_at: "2023-04-21T03:02:00.000Z"
  },
  {
    id: "242",
    customer_id: "38",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "165",
    points_awarded: 16,
    description: "Evening treat",
    created_at: "2023-11-14T17:21:00.000Z",
    updated_at: "2023-11-14T17:21:00.000Z"
  },
  {
    id: "243",
    customer_id: "38",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "197",
    points_awarded: 19,
    description: "Decaf coffee",
    created_at: "2024-10-04T08:31:00.000Z",
    updated_at: "2024-10-04T08:31:00.000Z"
  },
  {
    id: "244",
    customer_id: "38",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "444",
    points_awarded: 44,
    description: "Frappuccino and cookies",
    created_at: "2023-02-25T12:06:00.000Z",
    updated_at: "2023-02-25T12:06:00.000Z"
  },
  {
    id: "245",
    customer_id: "38",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "578",
    points_awarded: 57,
    description: "Latte and sandwich",
    created_at: "2024-11-02T19:10:00.000Z",
    updated_at: "2024-11-02T19:10:00.000Z"
  },
  {
    id: "246",
    customer_id: "38",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "475",
    points_awarded: 47,
    description: "Mocha and bagel",
    created_at: "2023-02-08T04:11:00.000Z",
    updated_at: "2023-02-08T04:11:00.000Z"
  },
  {
    id: "247",
    customer_id: "38",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "180",
    points_awarded: 18,
    description: "Specialty drink",
    created_at: "2024-06-12T07:33:00.000Z",
    updated_at: "2024-06-12T07:33:00.000Z"
  },
  {
    id: "248",
    customer_id: "38",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "338",
    points_awarded: 33,
    description: "Decaf coffee",
    created_at: "2023-10-17T14:44:00.000Z",
    updated_at: "2023-10-17T14:44:00.000Z"
  },
  {
    id: "249",
    customer_id: "39",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "598",
    points_awarded: 59,
    description: "Meeting coffee for 3",
    created_at: "2023-09-27T10:58:00.000Z",
    updated_at: "2023-09-27T10:58:00.000Z"
  },
  {
    id: "250",
    customer_id: "39",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "713",
    points_awarded: 71,
    description: "Breakfast combo",
    created_at: "2024-09-06T19:45:00.000Z",
    updated_at: "2024-09-06T19:45:00.000Z"
  },
  {
    id: "251",
    customer_id: "39",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "86",
    points_awarded: 8,
    description: "Tea and scones",
    created_at: "2023-01-12T07:45:00.000Z",
    updated_at: "2023-01-12T07:45:00.000Z"
  },
  {
    id: "252",
    customer_id: "39",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "553",
    points_awarded: 55,
    description: "Cappuccino and cake slice",
    created_at: "2023-02-21T23:30:00.000Z",
    updated_at: "2023-02-21T23:30:00.000Z"
  },
  {
    id: "253",
    customer_id: "39",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "550",
    points_awarded: 55,
    description: "Evening treat",
    created_at: "2024-07-06T01:22:00.000Z",
    updated_at: "2024-07-06T01:22:00.000Z"
  },
  {
    id: "254",
    customer_id: "39",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "218",
    points_awarded: 21,
    description: "Breakfast combo",
    created_at: "2023-12-16T19:05:00.000Z",
    updated_at: "2023-12-16T19:05:00.000Z"
  },
  {
    id: "255",
    customer_id: "39",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "786",
    points_awarded: 78,
    description: "Meeting coffee for 3",
    created_at: "2023-02-01T03:52:00.000Z",
    updated_at: "2023-02-01T03:52:00.000Z"
  },
  {
    id: "256",
    customer_id: "39",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "297",
    points_awarded: 29,
    description: "Latte and sandwich",
    created_at: "2023-03-15T04:20:00.000Z",
    updated_at: "2023-03-15T04:20:00.000Z"
  },
  {
    id: "257",
    customer_id: "39",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "75",
    points_awarded: 7,
    description: "Americano and croissant",
    created_at: "2023-10-22T09:00:00.000Z",
    updated_at: "2023-10-22T09:00:00.000Z"
  },
  {
    id: "258",
    customer_id: "39",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "419",
    points_awarded: 41,
    description: "Lunch special",
    created_at: "2023-10-12T10:17:00.000Z",
    updated_at: "2023-10-12T10:17:00.000Z"
  },
  {
    id: "259",
    customer_id: "39",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "742",
    points_awarded: 74,
    description: "Specialty drink",
    created_at: "2023-08-15T05:02:00.000Z",
    updated_at: "2023-08-15T05:02:00.000Z"
  },
  {
    id: "260",
    customer_id: "40",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "281",
    points_awarded: 28,
    description: "Espresso shot",
    created_at: "2024-05-07T04:46:00.000Z",
    updated_at: "2024-05-07T04:46:00.000Z"
  },
  {
    id: "261",
    customer_id: "40",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "170",
    points_awarded: 17,
    description: "Espresso and muffin",
    created_at: "2023-09-27T15:46:00.000Z",
    updated_at: "2023-09-27T15:46:00.000Z"
  },
  {
    id: "262",
    customer_id: "40",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "159",
    points_awarded: 15,
    description: "Cappuccino and cake slice",
    created_at: "2024-06-17T04:24:00.000Z",
    updated_at: "2024-06-17T04:24:00.000Z"
  },
  {
    id: "263",
    customer_id: "40",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "195",
    points_awarded: 19,
    description: "Chai latte and biscuit",
    created_at: "2023-11-16T16:56:00.000Z",
    updated_at: "2023-11-16T16:56:00.000Z"
  },
  {
    id: "264",
    customer_id: "40",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "781",
    points_awarded: 78,
    description: "Latte and sandwich",
    created_at: "2023-02-18T02:12:00.000Z",
    updated_at: "2023-02-18T02:12:00.000Z"
  },
  {
    id: "265",
    customer_id: "41",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "206",
    points_awarded: 20,
    description: "Lunch special",
    created_at: "2023-01-01T21:19:00.000Z",
    updated_at: "2023-01-01T21:19:00.000Z"
  },
  {
    id: "266",
    customer_id: "41",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "601",
    points_awarded: 60,
    description: "Espresso and muffin",
    created_at: "2023-06-12T21:25:00.000Z",
    updated_at: "2023-06-12T21:25:00.000Z"
  },
  {
    id: "267",
    customer_id: "41",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "827",
    points_awarded: 82,
    description: "Hot chocolate and pastry",
    created_at: "2023-03-21T06:29:00.000Z",
    updated_at: "2023-03-21T06:29:00.000Z"
  },
  {
    id: "268",
    customer_id: "42",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "563",
    points_awarded: 56,
    description: "Cappuccino and cake slice",
    created_at: "2023-04-17T21:36:00.000Z",
    updated_at: "2023-04-17T21:36:00.000Z"
  },
  {
    id: "269",
    customer_id: "42",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "317",
    points_awarded: 31,
    description: "Lunch special",
    created_at: "2023-12-22T15:00:00.000Z",
    updated_at: "2023-12-22T15:00:00.000Z"
  },
  {
    id: "270",
    customer_id: "42",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "170",
    points_awarded: 17,
    description: "Iced coffee and sandwich",
    created_at: "2024-02-11T00:18:00.000Z",
    updated_at: "2024-02-11T00:18:00.000Z"
  },
  {
    id: "271",
    customer_id: "42",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "138",
    points_awarded: 13,
    description: "Lunch special",
    created_at: "2024-10-04T18:54:00.000Z",
    updated_at: "2024-10-04T18:54:00.000Z"
  },
  {
    id: "272",
    customer_id: "42",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "284",
    points_awarded: 28,
    description: "Americano and croissant",
    created_at: "2023-12-07T01:53:00.000Z",
    updated_at: "2023-12-07T01:53:00.000Z"
  },
  {
    id: "273",
    customer_id: "42",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "167",
    points_awarded: 16,
    description: "Macchiato and donut",
    created_at: "2024-08-18T17:42:00.000Z",
    updated_at: "2024-08-18T17:42:00.000Z"
  },
  {
    id: "274",
    customer_id: "42",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "144",
    points_awarded: 14,
    description: "Cold brew and muffin",
    created_at: "2023-03-19T03:31:00.000Z",
    updated_at: "2023-03-19T03:31:00.000Z"
  },
  {
    id: "275",
    customer_id: "42",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "622",
    points_awarded: 62,
    description: "Afternoon snack",
    created_at: "2024-10-26T10:33:00.000Z",
    updated_at: "2024-10-26T10:33:00.000Z"
  },
  {
    id: "276",
    customer_id: "43",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "472",
    points_awarded: 47,
    description: "Tea and scones",
    created_at: "2023-09-26T04:19:00.000Z",
    updated_at: "2023-09-26T04:19:00.000Z"
  },
  {
    id: "277",
    customer_id: "43",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "92",
    points_awarded: 9,
    description: "Espresso shot",
    created_at: "2024-01-28T15:06:00.000Z",
    updated_at: "2024-01-28T15:06:00.000Z"
  },
  {
    id: "278",
    customer_id: "43",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "314",
    points_awarded: 31,
    description: "Breakfast combo",
    created_at: "2024-12-03T05:48:00.000Z",
    updated_at: "2024-12-03T05:48:00.000Z"
  },
  {
    id: "279",
    customer_id: "43",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "451",
    points_awarded: 45,
    description: "Evening treat",
    created_at: "2024-04-20T13:05:00.000Z",
    updated_at: "2024-04-20T13:05:00.000Z"
  },
  {
    id: "280",
    customer_id: "43",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "710",
    points_awarded: 71,
    description: "Espresso and muffin",
    created_at: "2023-11-06T03:28:00.000Z",
    updated_at: "2023-11-06T03:28:00.000Z"
  },
  {
    id: "281",
    customer_id: "43",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "695",
    points_awarded: 69,
    description: "Chai latte and biscuit",
    created_at: "2023-07-21T16:46:00.000Z",
    updated_at: "2023-07-21T16:46:00.000Z"
  },
  {
    id: "282",
    customer_id: "43",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "67",
    points_awarded: 6,
    description: "Frappuccino and cookies",
    created_at: "2023-07-01T01:33:00.000Z",
    updated_at: "2023-07-01T01:33:00.000Z"
  },
  {
    id: "283",
    customer_id: "44",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "473",
    points_awarded: 47,
    description: "Lunch special",
    created_at: "2024-01-25T18:36:00.000Z",
    updated_at: "2024-01-25T18:36:00.000Z"
  },
  {
    id: "284",
    customer_id: "44",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "510",
    points_awarded: 51,
    description: "Frappuccino and cookies",
    created_at: "2024-04-28T03:03:00.000Z",
    updated_at: "2024-04-28T03:03:00.000Z"
  },
  {
    id: "285",
    customer_id: "44",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "585",
    points_awarded: 58,
    description: "Afternoon snack",
    created_at: "2024-05-01T11:14:00.000Z",
    updated_at: "2024-05-01T11:14:00.000Z"
  },
  {
    id: "286",
    customer_id: "44",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "766",
    points_awarded: 76,
    description: "Americano and croissant",
    created_at: "2023-01-27T09:20:00.000Z",
    updated_at: "2023-01-27T09:20:00.000Z"
  },
  {
    id: "287",
    customer_id: "44",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "341",
    points_awarded: 34,
    description: "Team breakfast order",
    created_at: "2023-10-08T02:38:00.000Z",
    updated_at: "2023-10-08T02:38:00.000Z"
  },
  {
    id: "288",
    customer_id: "44",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "378",
    points_awarded: 37,
    description: "Afternoon snack",
    created_at: "2023-04-01T22:11:00.000Z",
    updated_at: "2023-04-01T22:11:00.000Z"
  },
  {
    id: "289",
    customer_id: "44",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "434",
    points_awarded: 43,
    description: "Meeting coffee for 3",
    created_at: "2023-12-12T22:46:00.000Z",
    updated_at: "2023-12-12T22:46:00.000Z"
  },
  {
    id: "290",
    customer_id: "44",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "78",
    points_awarded: 7,
    description: "Meeting coffee for 3",
    created_at: "2023-09-25T19:51:00.000Z",
    updated_at: "2023-09-25T19:51:00.000Z"
  },
  {
    id: "291",
    customer_id: "44",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "211",
    points_awarded: 21,
    description: "Cold brew and muffin",
    created_at: "2024-10-14T05:59:00.000Z",
    updated_at: "2024-10-14T05:59:00.000Z"
  },
  {
    id: "292",
    customer_id: "44",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "453",
    points_awarded: 45,
    description: "Lunch special",
    created_at: "2024-11-13T09:01:00.000Z",
    updated_at: "2024-11-13T09:01:00.000Z"
  },
  {
    id: "293",
    customer_id: "44",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "690",
    points_awarded: 69,
    description: "Evening treat",
    created_at: "2023-03-10T10:22:00.000Z",
    updated_at: "2023-03-10T10:22:00.000Z"
  },
  {
    id: "294",
    customer_id: "44",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "485",
    points_awarded: 48,
    description: "Breakfast combo",
    created_at: "2023-04-04T20:36:00.000Z",
    updated_at: "2023-04-04T20:36:00.000Z"
  },
  {
    id: "295",
    customer_id: "45",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "310",
    points_awarded: 31,
    description: "Decaf coffee",
    created_at: "2023-05-04T01:37:00.000Z",
    updated_at: "2023-05-04T01:37:00.000Z"
  },
  {
    id: "296",
    customer_id: "45",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "401",
    points_awarded: 40,
    description: "Cold brew and muffin",
    created_at: "2024-06-26T13:56:00.000Z",
    updated_at: "2024-06-26T13:56:00.000Z"
  },
  {
    id: "297",
    customer_id: "45",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "618",
    points_awarded: 61,
    description: "Latte and sandwich",
    created_at: "2023-07-12T04:23:00.000Z",
    updated_at: "2023-07-12T04:23:00.000Z"
  },
  {
    id: "298",
    customer_id: "45",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "357",
    points_awarded: 35,
    description: "Breakfast combo",
    created_at: "2023-01-23T13:54:00.000Z",
    updated_at: "2023-01-23T13:54:00.000Z"
  },
  {
    id: "299",
    customer_id: "45",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "751",
    points_awarded: 75,
    description: "Breakfast combo",
    created_at: "2024-02-16T07:16:00.000Z",
    updated_at: "2024-02-16T07:16:00.000Z"
  },
  {
    id: "300",
    customer_id: "45",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "366",
    points_awarded: 36,
    description: "Meeting coffee for 3",
    created_at: "2024-05-04T10:42:00.000Z",
    updated_at: "2024-05-04T10:42:00.000Z"
  },
  {
    id: "301",
    customer_id: "45",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "117",
    points_awarded: 11,
    description: "Specialty drink",
    created_at: "2024-10-23T05:19:00.000Z",
    updated_at: "2024-10-23T05:19:00.000Z"
  },
  {
    id: "302",
    customer_id: "45",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "135",
    points_awarded: 13,
    description: "Evening treat",
    created_at: "2024-03-24T00:42:00.000Z",
    updated_at: "2024-03-24T00:42:00.000Z"
  },
  {
    id: "303",
    customer_id: "45",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "361",
    points_awarded: 36,
    description: "Latte and sandwich",
    created_at: "2023-08-04T21:10:00.000Z",
    updated_at: "2023-08-04T21:10:00.000Z"
  },
  {
    id: "304",
    customer_id: "46",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "73",
    points_awarded: 7,
    description: "Tea and scones",
    created_at: "2023-10-18T05:09:00.000Z",
    updated_at: "2023-10-18T05:09:00.000Z"
  },
  {
    id: "305",
    customer_id: "46",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "807",
    points_awarded: 80,
    description: "Decaf coffee",
    created_at: "2023-01-27T23:39:00.000Z",
    updated_at: "2023-01-27T23:39:00.000Z"
  },
  {
    id: "306",
    customer_id: "46",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "289",
    points_awarded: 28,
    description: "Latte and sandwich",
    created_at: "2024-08-08T10:42:00.000Z",
    updated_at: "2024-08-08T10:42:00.000Z"
  },
  {
    id: "307",
    customer_id: "46",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "835",
    points_awarded: 83,
    description: "Iced coffee and sandwich",
    created_at: "2024-07-03T22:00:00.000Z",
    updated_at: "2024-07-03T22:00:00.000Z"
  },
  {
    id: "308",
    customer_id: "46",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "643",
    points_awarded: 64,
    description: "Team breakfast order",
    created_at: "2024-07-28T08:24:00.000Z",
    updated_at: "2024-07-28T08:24:00.000Z"
  },
  {
    id: "309",
    customer_id: "46",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "812",
    points_awarded: 81,
    description: "Afternoon snack",
    created_at: "2024-01-24T08:05:00.000Z",
    updated_at: "2024-01-24T08:05:00.000Z"
  },
  {
    id: "310",
    customer_id: "46",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "269",
    points_awarded: 26,
    description: "Lunch special",
    created_at: "2024-04-26T23:13:00.000Z",
    updated_at: "2024-04-26T23:13:00.000Z"
  },
  {
    id: "311",
    customer_id: "46",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "677",
    points_awarded: 67,
    description: "Tea and scones",
    created_at: "2023-09-01T03:15:00.000Z",
    updated_at: "2023-09-01T03:15:00.000Z"
  },
  {
    id: "312",
    customer_id: "47",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "389",
    points_awarded: 38,
    description: "Lunch special",
    created_at: "2024-01-10T02:14:00.000Z",
    updated_at: "2024-01-10T02:14:00.000Z"
  },
  {
    id: "313",
    customer_id: "47",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "197",
    points_awarded: 19,
    description: "Specialty drink",
    created_at: "2023-11-15T16:18:00.000Z",
    updated_at: "2023-11-15T16:18:00.000Z"
  },
  {
    id: "314",
    customer_id: "47",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "485",
    points_awarded: 48,
    description: "Frappuccino and cookies",
    created_at: "2024-06-25T23:19:00.000Z",
    updated_at: "2024-06-25T23:19:00.000Z"
  },
  {
    id: "315",
    customer_id: "48",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "763",
    points_awarded: 76,
    description: "Mocha and bagel",
    created_at: "2023-07-22T11:08:00.000Z",
    updated_at: "2023-07-22T11:08:00.000Z"
  },
  {
    id: "316",
    customer_id: "48",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "473",
    points_awarded: 47,
    description: "Team breakfast order",
    created_at: "2024-08-05T03:16:00.000Z",
    updated_at: "2024-08-05T03:16:00.000Z"
  },
  {
    id: "317",
    customer_id: "48",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "597",
    points_awarded: 59,
    description: "Macchiato and donut",
    created_at: "2023-06-28T12:19:00.000Z",
    updated_at: "2023-06-28T12:19:00.000Z"
  },
  {
    id: "318",
    customer_id: "49",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "527",
    points_awarded: 52,
    description: "Mocha and bagel",
    created_at: "2024-02-15T11:33:00.000Z",
    updated_at: "2024-02-15T11:33:00.000Z"
  },
  {
    id: "319",
    customer_id: "49",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "831",
    points_awarded: 83,
    description: "Team breakfast order",
    created_at: "2023-10-04T23:06:00.000Z",
    updated_at: "2023-10-04T23:06:00.000Z"
  },
  {
    id: "320",
    customer_id: "49",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "607",
    points_awarded: 60,
    description: "Chai latte and biscuit",
    created_at: "2023-05-25T04:23:00.000Z",
    updated_at: "2023-05-25T04:23:00.000Z"
  },
  {
    id: "321",
    customer_id: "49",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "642",
    points_awarded: 64,
    description: "Mocha and bagel",
    created_at: "2024-08-16T13:45:00.000Z",
    updated_at: "2024-08-16T13:45:00.000Z"
  },
  {
    id: "322",
    customer_id: "49",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "743",
    points_awarded: 74,
    description: "Macchiato and donut",
    created_at: "2023-07-10T13:47:00.000Z",
    updated_at: "2023-07-10T13:47:00.000Z"
  },
  {
    id: "323",
    customer_id: "49",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "228",
    points_awarded: 22,
    description: "Espresso shot",
    created_at: "2024-03-22T07:46:00.000Z",
    updated_at: "2024-03-22T07:46:00.000Z"
  },
  {
    id: "324",
    customer_id: "49",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "121",
    points_awarded: 12,
    description: "Evening treat",
    created_at: "2023-01-05T17:49:00.000Z",
    updated_at: "2023-01-05T17:49:00.000Z"
  },
  {
    id: "325",
    customer_id: "49",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "790",
    points_awarded: 79,
    description: "Tea and scones",
    created_at: "2023-07-20T23:39:00.000Z",
    updated_at: "2023-07-20T23:39:00.000Z"
  },
  {
    id: "326",
    customer_id: "49",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "802",
    points_awarded: 80,
    description: "Meeting coffee for 3",
    created_at: "2024-03-12T03:03:00.000Z",
    updated_at: "2024-03-12T03:03:00.000Z"
  },
  {
    id: "327",
    customer_id: "50",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "714",
    points_awarded: 71,
    description: "Specialty drink",
    created_at: "2023-03-13T17:56:00.000Z",
    updated_at: "2023-03-13T17:56:00.000Z"
  },
  {
    id: "328",
    customer_id: "50",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "226",
    points_awarded: 22,
    description: "Mocha and bagel",
    created_at: "2024-01-11T15:33:00.000Z",
    updated_at: "2024-01-11T15:33:00.000Z"
  },
  {
    id: "329",
    customer_id: "50",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "142",
    points_awarded: 14,
    description: "Meeting coffee for 3",
    created_at: "2024-11-12T13:47:00.000Z",
    updated_at: "2024-11-12T13:47:00.000Z"
  },
  {
    id: "330",
    customer_id: "50",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "363",
    points_awarded: 36,
    description: "Cold brew and muffin",
    created_at: "2024-08-19T00:18:00.000Z",
    updated_at: "2024-08-19T00:18:00.000Z"
  },
  {
    id: "331",
    customer_id: "50",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "819",
    points_awarded: 81,
    description: "Tea and scones",
    created_at: "2023-03-15T11:22:00.000Z",
    updated_at: "2023-03-15T11:22:00.000Z"
  },
  {
    id: "332",
    customer_id: "50",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "96",
    points_awarded: 9,
    description: "Tea and scones",
    created_at: "2023-03-26T19:53:00.000Z",
    updated_at: "2023-03-26T19:53:00.000Z"
  },
  {
    id: "333",
    customer_id: "50",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "82",
    points_awarded: 8,
    description: "Hot chocolate and pastry",
    created_at: "2024-03-21T10:37:00.000Z",
    updated_at: "2024-03-21T10:37:00.000Z"
  },
  {
    id: "334",
    customer_id: "50",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "724",
    points_awarded: 72,
    description: "Afternoon snack",
    created_at: "2023-07-21T09:54:00.000Z",
    updated_at: "2023-07-21T09:54:00.000Z"
  },
  {
    id: "335",
    customer_id: "50",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "270",
    points_awarded: 27,
    description: "Cappuccino and cake slice",
    created_at: "2023-03-13T02:03:00.000Z",
    updated_at: "2023-03-13T02:03:00.000Z"
  },
  {
    id: "336",
    customer_id: "50",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "779",
    points_awarded: 77,
    description: "Frappuccino and cookies",
    created_at: "2024-06-23T22:59:00.000Z",
    updated_at: "2024-06-23T22:59:00.000Z"
  },
  {
    id: "337",
    customer_id: "50",
    business_id: "1",
    interaction_type: "purchase",
    amount_spent: "246",
    points_awarded: 24,
    description: "Espresso and muffin",
    created_at: "2023-07-24T09:22:00.000Z",
    updated_at: "2023-07-24T09:22:00.000Z"
  }
]


const dummyRewardsCatalog: RewardsCatalog[] = [
  {
    id: "1",
    business_id: "1",
    name: "Free Coffee",
    description: "Get a free regular coffee",
    points_required: 50,
    is_active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z"
  },
  {
    id: "2",
    business_id: "1",
    name: "Free Pastry",
    description: "Get a free pastry of your choice",
    points_required: 30,
    is_active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z"
  },
  {
    id: "3",
    business_id: "1",
    name: "10% Discount",
    description: "10% off your next purchase",
    points_required: 20,
    is_active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z"
  }
]

const dummyCustomerRewards: CustomerReward[] = [
  {
    id: "1",
    customer_id: "1",
    business_id: "1",
    reward_id: "3",
    points_spent: 20,
    status: "redeemed",
    redeemed_at: "2024-01-10T12:00:00Z",
    created_at: "2024-01-10T12:00:00Z",
    updated_at: "2024-01-10T12:00:00Z",
    reward: dummyRewardsCatalog[2]
  },
  {
    id: "2", 
    customer_id: "2",
    business_id: "1",
    reward_id: "2",
    points_spent: 30,
    status: "redeemed",
    redeemed_at: "2024-01-08T14:30:00Z",
    created_at: "2024-01-08T14:30:00Z",
    updated_at: "2024-01-08T14:30:00Z",
    reward: dummyRewardsCatalog[1]
  }
]

export function CustomersPage({ user_id, business_id }: CustomersPageProps) {
  // SECTION 1: State and Data Fetching
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<CustomersPageData>({
    business: null,
    interactions: [],
    customers: [],
    rewardsCatalog: [],
    customerRewards: []
  })

  // Component state
  const [recordActivityModalOpen, setRecordActivityModalOpen] = useState(false)
  const [bulkMessageModalOpen, setBulkMessageModalOpen] = useState(false)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [activeFilters, setActiveFilters] = useState<FilterOption[]>([])

  // Simulate data loading with dummy data
  const loadDummyData = () => {
    setIsLoading(true)
    // Simulate network delay
    setTimeout(() => {
      setData({
        business: dummyBusiness,
        interactions: dummyInteractions,
        customers: dummyCustomers,
        rewardsCatalog: dummyRewardsCatalog,
        customerRewards: dummyCustomerRewards
      })
      setIsLoading(false)
    }, 500)
  }

  useEffect(() => {
    loadDummyData()
  }, [])

  // Derived state and calculations
  const processedCustomers = useMemo(() => {
    const { business, interactions, customers, customerRewards } = data
    if (!business || !interactions.length || !customers.length) return []

    return customers.map(customer => {
      const customerInteractions = interactions.filter(i => i.customer_id === customer.id)
      const customerRewardHistory = customerRewards.filter(r => r.customer_id === customer.id)

      // Calculate total points from interactions
      const totalPointsEarned = customerInteractions.reduce((sum, i) => sum + (i.points_awarded || 0), 0)
      const totalPointsSpent = customerRewardHistory.reduce((sum, r) => sum + (r.points_spent || 0), 0)
      const currentPoints = totalPointsEarned - totalPointsSpent

      // Calculate total spend and visits
      const totalSpend = customerInteractions.reduce((sum, i) => sum + (Number(i.amount_spent) || 0), 0)
      const totalVisits = customerInteractions.length

      // Get last visit date
      const lastVisit = customerInteractions[0]?.created_at
      const lastVisitDate = lastVisit ? new Date(lastVisit) : null
      const daysSinceLastVisit = lastVisitDate ? 
        Math.floor((new Date().getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24)) : 999

      // Calculate TAG
      const hasEnoughPoints = currentPoints >= 100
      const hasNotVisitedRecently = daysSinceLastVisit > 30
      const tag = hasNotVisitedRecently && hasEnoughPoints ? "Send Promotion" : "Active"

      // Calculate RPI (Reward Priority Index)
      const rewardsUsed = customerRewardHistory.length
      const rpi = Math.min(200, Math.floor(
        (totalVisits * 10) + (currentPoints * 0.5) - (rewardsUsed * 20)
      ))

      // Calculate LEI (Loyalty Engagement Index)
      const avgSpendPerVisit = totalVisits > 0 ? totalSpend / totalVisits : 0
      const visitFrequency = totalVisits > 0 ? Math.min(30, 365 / daysSinceLastVisit) : 0
      const lei = Math.min(200, Math.floor(
        (visitFrequency * 5) + (avgSpendPerVisit * 0.01)
      ))

      // Calculate spending score (0-100)
      const maxSpend = Math.max(...customers.map(c => {
        const cInteractions = interactions.filter(i => i.customer_id === c.id)
        return cInteractions.reduce((sum, i) => sum + (Number(i.amount_spent) || 0), 0)
      }), 1)
      const spendingScore = Math.min(100, Math.floor((totalSpend / maxSpend) * 100))

      return {
        ...customer,
        totalSpend: totalSpend.toLocaleString(),
        totalVisits: totalVisits.toString(),
        lastVisitDate: lastVisitDate ? lastVisitDate.toLocaleDateString('en-GB') : 'Never',
        points: currentPoints.toString(),
        tag,
        rpi: rpi.toString(),
        lei: lei.toString(),
        spendingScore,
        phoneId: customer.phone_number,
        name: customer.full_name || customer.nickname || 'Unknown'
      }
    })
  }, [data])

  // Calculate metrics
  const metrics = useMemo((): CustomerMetrics => {
    if (!processedCustomers.length) return {
      totalCustomers: 0,
      newCustomersThisMonth: 0,
      avgSpendPerVisit: 0,
      visitFrequency: 0
    }

    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    
    const newCustomersThisMonth = data.customers.filter(c => 
      new Date(c.created_at) >= lastMonth
    ).length

    const totalSpend = processedCustomers.reduce((sum, c) => 
      sum + Number(c.totalSpend.replace(/,/g, '')), 0
    )
    const totalVisits = processedCustomers.reduce((sum, c) => 
      sum + Number(c.totalVisits), 0
    )

    const rawVisitFrequency = processedCustomers.length > 0 ? totalVisits / processedCustomers.length : 0
    
    return {
      totalCustomers: processedCustomers.length,
      newCustomersThisMonth,
      avgSpendPerVisit: totalVisits > 0 ? totalSpend / totalVisits : 0,
      visitFrequency: rawVisitFrequency
    }
  }, [processedCustomers, data.customers])

  // Helper function for visit frequency calculation and display
  const getVisitFrequencyDisplay = (frequency: number) => {
    if (frequency >= 1) {
      return {
        value: Math.round(frequency * 10) / 10, // Round to 1 decimal place
        unit: 'per month',
        unitShort: '/month'
      }
    } else {
      return {
        value: Math.round(frequency * 12 * 10) / 10, // Convert to yearly and round
        unit: 'per year', 
        unitShort: '/year'
      }
    }
  }

  // Event handlers
  const handleSort = useCallback((field: string, direction: "asc" | "desc") => {
    setSortField(field)
    setSortDirection(direction)
  }, [])

  const handleFilter = useCallback((filters: FilterOption[]) => {
    setActiveFilters(filters)
  }, [])

  const handleRetry = useCallback(() => {
    loadDummyData()
  }, [])

  const handleRecordActivity = useCallback(() => {
    setRecordActivityModalOpen(true)
  }, [])

  const handleSendBulkMessage = useCallback(() => {
    setBulkMessageModalOpen(true)
  }, [])

  const handleExport = useCallback(() => {
    // Export functionality
    console.log('Exporting customer data...')
  }, [])

  // SECTION 2: Loading and Error States
  if (isLoading) {
    return <LoadingComponent message="Loading customers..." />
  }

  if (error) {
    return (
      <ErrorComponent 
        message={error || 'Unknown error occurred'}
        onRetry={handleRetry}
      />
    )
  }

  if (!processedCustomers.length) {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Customers</h1>
          <Button onClick={handleRecordActivity} className="gap-2">
            <Plus className="h-4 w-4" />
            Record Activity
          </Button>
        </div>
        <EmptyStateComponent
          title="No customers yet"
          description="Start by recording customer interactions to build your customer base."
          actionLabel="Record Activity"
          onAction={handleRecordActivity}
          icon={<Users className="h-12 w-12 text-gray-400" />}
        />
      </div>
    )
  }

  // SECTION 3: Main Render
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Metrics Cards */}
      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {/* Record Activity Card */}
        <Card 
          className="p-4 bg-[#F8843A] text-white flex items-center cursor-pointer hover:bg-[#E77A35] transition-colors" 
          onClick={handleRecordActivity}
        >
          <div className="bg-white bg-opacity-20 rounded-full p-3 mr-3">
            <Plus className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium">Record</h3>
            <h3 className="text-lg font-medium">Customer</h3>
            <h3 className="text-lg font-medium">Activity</h3>
          </div>
        </Card>

        {/* Total Customers */}
        <Card className="p-4">
          <div className="text-sm text-gray-500 mb-2">Total Customers</div>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold">{metrics.totalCustomers}</div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-48">
                <p>Total number of unique customers who have interacted with your business</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </Card>

        {/* New Customers */}
        <Card className="p-4">
          <div className="text-sm text-gray-500 mb-2">
            New Customers <span className="text-xs">/month</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold">{metrics.newCustomersThisMonth}</div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-48">
                <p>Number of new customers who joined your business in the last 30 days</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </Card>

        {/* Average Spend */}
        <Card className="p-4">
          <div className="text-sm text-gray-500 mb-2">Avg Spend per Visit</div>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold">
              {Math.round(metrics.avgSpendPerVisit).toLocaleString()} <span className="text-sm">TZs</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-48">
                <p>Average amount customers spend each time they visit your business</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </Card>

        {/* Visit Frequency */}
        <Card className="p-4">
          <div className="text-sm text-gray-500 mb-2">
            Visit Frequency <span className="text-xs">{getVisitFrequencyDisplay(metrics.visitFrequency).unitShort}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold">{getVisitFrequencyDisplay(metrics.visitFrequency).value}</div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-48">
                <p>Unique customers who visited your business</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </Card>
        </div>
      </TooltipProvider>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Customer List - Moved to top, full width */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Customer List</h2>
            <span className="text-sm text-gray-500">{processedCustomers.length} customers</span>
          </div>
          <Card className="p-6">
            <CustomersDetailTable
              customers={processedCustomers}
              sortField={sortField}
              sortDirection={sortDirection}
              filters={activeFilters}
              onSort={handleSort}
              onFilter={handleFilter}
              onSendBulkMessage={handleSendBulkMessage}
            />
          </Card>
        </div>
        
        {/* Recent Activity & Rewards - Side by side below Customer List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Recent Interactions</h2>
            </div>
            <Card className="p-6">
              <CustomerInteractionsTable
                interactions={data.interactions}
                customers={data.customers}
              />
            </Card>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Rewards Activity</h2>
            </div>
            <Card className="p-6">
              <RewardsTable
                rewardsCatalog={data.rewardsCatalog}
                customerRewards={data.customerRewards}
                customers={data.customers}
              />
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <RecordActivityModal
        open={recordActivityModalOpen}
        onOpenChange={setRecordActivityModalOpen}
        businessId={business_id || "1"}
        onSuccess={handleRetry}
      />

      <SendBulkMessageModal
        open={bulkMessageModalOpen}
        onOpenChange={setBulkMessageModalOpen}
        customers={processedCustomers}
        businessId={business_id || "1"}
      />
    </div>
  )
}

type Module = DefineComponent

// MongoDB documents

interface Masterplan {
  _id?: string
  title?: string
  molgId?: string
  layerName?: string
  created?: string
  publicReviews?: PublicReview[]
  objectionsCount?: number;
}

interface PublicReview {
  _id?: string
  masterplanId?: string
  masterplan?: Masterplan[]
  layerName?: string
  startDate?: string
  endDate?: string
  objectionsCount?: number
}

interface Person {
  _id?: string
  name?: string
  lot?: string
  neighborhood?: string
  block?: string
  street?: string
  phone?: string
  id?: string
}

interface Objection {
  _id?: string
  publicReviewId?: string
  publicReview?: PublicReview
  person?: Person
  category?: string
  comment?: string
  attachmentId?: string
}

// Other types

interface Alert {
  message: string;
  type?: string;
  timestamp?: number;
}

declare namespace WPS {
  interface LiteralInput {
    identifier: string;
    data: string;
  }

  interface ComplexInput {
    identifier: string;
    data: string;
  }
}

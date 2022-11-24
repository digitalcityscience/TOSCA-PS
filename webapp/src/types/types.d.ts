type Module = DefineComponent

// MongoDB documents

interface Masterplan {
  _id?: string
  title?: string
  molgId?: string
  layerName?: string
  created?: string
}

interface PublicReview {
  _id?: string
  masterplan?: string
  layerName?: string
  startDate?: string
  endDate?: string
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

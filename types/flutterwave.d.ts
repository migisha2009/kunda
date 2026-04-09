declare module 'flutterwave-node-v3' {
  class Flutterwave {
    constructor(secretKey: string)
    
    Payment: {
      link(data: any): Promise<{
        status: string
        data?: {
          link: {
            link_url: string
            tx_ref: string
          }
        }
      }>
      
      verify(tx_ref: string): Promise<{
        status: string
        data?: {
          status: string
          tx_ref: string
          amount: number
          currency: string
          meta: {
            bookingId: string
          }
        }
      }>
    }
  }
  
  export = Flutterwave
}

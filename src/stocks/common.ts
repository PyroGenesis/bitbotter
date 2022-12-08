
export interface StockHistory {    
    name: string,
    prices: number[],
}

export interface Stock {    
    name: string,
    low: number,
    high: number,
    last_update: number,
}

export const results_file = '/stocks/monitor_results.txt';

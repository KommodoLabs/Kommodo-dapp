import "./main.css"
import { useEffect, useState, useMemo } from 'react'

import Balancer from 'react-wrap-balancer'

//Bootstrap 
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import ListGroup from 'react-bootstrap/ListGroup'
import Accordion from 'react-bootstrap/Accordion'
import InputGroup from 'react-bootstrap/InputGroup'
import ButtonGroup from 'react-bootstrap/ButtonGroup'

import { FaEdit } from "react-icons/fa"
import { IoSwapHorizontalSharp } from "react-icons/io5"

//Web3
import { parseUnits, Address, encodeFunctionData, encodeAbiParameters, keccak256 } from 'viem';
import { useConnect, useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSimulateContract,  useSendCalls, useCallsStatus, useReadContracts } from 'wagmi'

import { ERC20_abi } from "../assets/IERC20"
import { UniV3_Pool_abi } from "../assets/IUniswapV3Pool"
import { Kommodo_Pool_abi } from "../assets/IKommodoPool"
import { UniV3_Factory_abi } from "../assets/IUniswapV3Factory"
import { Kommodo_Factory_abi } from "../assets/IKommodoFactory"

import { Tokens } from "../assets/Tokens" 
import { Factory_Locations } from '../assets/Locations'

import Countdown from 'react-countdown'

const Borrow = () => {
    const eip702chains = [1, 11155111]
    /*Web3 connector values*/
    const chainId = useChainId()
    const account = useAccount()

    /*Kommodo values*/
    const [token0, setToken0] = useState(
        {
            "chainId": 0,
            "type": "",
            "address": "",
            "name": "",
            "symbol": "",
            "decimals": 0,
            "logoURI": ""
        }
    )
    const [token1, setToken1] = useState(
        {
            "chainId": 0,
            "type": "",
            "address": "",
            "name": "",
            "symbol": "",
            "decimals": 0,
            "logoURI": ""
        }
    ) 
    const [pool , setPool] = useState([{
            "chainId": 0,
            "type": "",
            "address": "",
            "name": "",
            "symbol": "",
            "decimals": 0,
            "logoURI": ""
        },
        {
            "chainId": 0,
            "type": "",
            "address": "",
            "name": "",
            "symbol": "",
            "decimals": 0,
            "logoURI": ""
        }
    ])
    const fees = [100, 500, 3000, 10000]
    const [slot0, setSlot0] = useState<readonly [bigint, number, number, number, number, number, boolean]>(
        [BigInt(0), 0, 0, 0, 0, 0 , false]
    )

    /*Helper functions*/
    function generateTokenLogo(token: any) {
        const initials = token.slice(0, 4).toUpperCase(); // limit letters
        const textColor = "#ffffff";
        let hash = 0;
        for (let i = 0; i < initials.length; i++) {
            hash = initials.charCodeAt(i) + ((hash << 5) - hash);
        }
        const bgColor = `hsl(${hash % 360}, 60%, 40%)`;
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
            <rect width="100%" height="100%" fill="${bgColor}" rx="20"/>
            <text 
                x="50%" 
                y="50%" 
                dominant-baseline="middle" 
                text-anchor="middle" 
                font-family="Arial, sans-serif" 
                font-size="64" 
                fill="${textColor}" 
                font-weight="bold"
            >
                ${initials}
            </text>
            </svg>
        `;

        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    }

    function rounding(x: any, max: any) {
        if (x % 1 == 0) {
            return 2
        } else {
            let size = -1 - Math.floor(Math.log10(x % 1)) + 2
            if (size < max){
                return(size)
            }  
            else {
                return(max)
            }
        }
    }

    function tick_to_sqrt(tick: number){
        return(BigInt(Math.floor(Math.sqrt(1.0001**tick) * (2**96))))
    }
    function price_to_sqrt(price: any){
        if(!isNaN(price)){
            return(BigInt(Math.floor(Math.sqrt(price) * (2**96))))
        }
        
    }
    function sqrt_to_tick(sqrt: any, tickSpacing: any){
        if(tickSpacing && sqrt){
            let tick_current = Math.floor(Math.log((Number(sqrt) / (2**96))**2) / Math.log(1.0001))
            let tick_nearest = Math.floor(tick_current / tickSpacing) * tickSpacing
            return(BigInt(tick_nearest))
        } else {
            return(BigInt(0))
        }
    } 
    function sqrt_to_price(sqrt: number){
        return((sqrt / 2**96)**2)
    }

    function price_close_log_index(price: number) {
        let floor_log = Math.floor(Math.log2(price))
        let price_0 = 2**floor_log
        if(price == price_0){
            return([floor_log, 0])
        } 
        let price_below = price_0
        let index_below = 0
        let price_above
        let index_above 
        let index = 1
        while(index < 5){
            let new_index = price_0/4 * index + price_0
            if(new_index < price){
                price_below = new_index
                index_below = index
            } else if (price_above == undefined) {
                price_above = new_index
                index_above = index
            }
            index +=1
        }
        if(Math.abs(price - price_below) < Math.abs(Number(price_above) - price)){
            return([floor_log, index_below])
        } else {
            if (index_above == 4){
                return([floor_log+1, 0])
            }
            else {
                return([floor_log, index_above])
            }
        }  
    }

    function convert_exp(exp: number, index: number){
        let new_exp
        let new_index = index
        if(index == 0){
            new_exp = -exp
        } else {
            new_exp = -exp -1
            if(index == 1){
                new_index = 3
            } else if(index == 3) {
                new_index = 1
            }
        }
        return([new_exp, new_index])
    }
    function get_exp_index_price(exp: number, index: number) {
        if(exp < 0){
            let new_exp_index = convert_exp(exp, index)
            return(1/((2**new_exp_index[0])/4*new_exp_index[1] + 2**new_exp_index[0]))
        } else {
            return((2**exp)/4*index + 2**exp)
        }  
    }
    
    function convert_price(price: number, token0: boolean) {
        if(token0){
            return(price)
        } else {
            return(1/price)
        }
    }

    function get_prices(exp: number, index: number, offset: number, count: number, tickSpacing: number){
        let price_start = get_exp_index_price(exp, index)
        let exp_offset = [price_start ,exp, index]
        let exp_array = []
        let i = 0
        while(i < Math.abs(offset)){
            if(offset < 0) {
                exp_offset = exp_offset[2] == 0 ? [get_exp_index_price(exp_offset[1]-1, 3), exp_offset[1]-1, 3] : [get_exp_index_price(exp_offset[1], exp_offset[2]-1), exp_offset[1], exp_offset[2]-1]
            } else {
                exp_offset = exp_offset[2] == 3 ? [get_exp_index_price(exp_offset[1]+1, 0), exp_offset[1]+1, 0] : [get_exp_index_price(exp_offset[1], exp_offset[2]+1), exp_offset[1], exp_offset[2]+1]
            }
            i += 1
        }
        let sqrt_position = price_to_sqrt(exp_offset[0])
        let tick_position = sqrt_to_tick(sqrt_position, tickSpacing)
        exp_offset.push(Number(tick_position))
        exp_array.push(exp_offset)
        let exp_below = exp_offset
        let exp_above = exp_offset
        let x = 0
        while(x < count){
            exp_below = exp_below[2] == 0 ? [get_exp_index_price(exp_below[1]-1, 3), exp_below[1]-1, 3] : [get_exp_index_price(exp_below[1], exp_below[2]-1), exp_below[1], exp_below[2]-1]
            let sqrt_position_below = price_to_sqrt(exp_below[0])
            let tick_position_below = sqrt_to_tick(sqrt_position_below, tickSpacing)
            exp_below.push(Number(tick_position_below))
            exp_array.push(exp_below)
            exp_above = exp_above[2] == 3 ? [get_exp_index_price(exp_above[1]+1, 0), exp_above[1]+1, 0] : [get_exp_index_price(exp_above[1], exp_above[2]+1), exp_above[1], exp_above[2]+1]
            let sqrt_position_above= price_to_sqrt(exp_above[0])
            let tick_position_above = sqrt_to_tick(sqrt_position_above, tickSpacing)
            exp_above.push(Number(tick_position_above))
            exp_array.push(exp_above)
            x += 1
        }
        return(exp_array)
    }

    function getAmount0(liquidity: bigint, sqrt_high: bigint, sqrt_low: bigint){
        return(liquidity * BigInt(2**96) * (sqrt_high - sqrt_low) / sqrt_high / sqrt_low)
    }
    function getAmount1(liquidity: bigint, sqrt_high: bigint, sqrt_low: bigint){
        return(liquidity * (sqrt_high - sqrt_low) / BigInt(2**96))
    }

    function liquidity_to_token_amount(liquidity: bigint, sqrt: any, tick: bigint, tickSpacing: bigint){
        //Current SQRTprice and position SQRTprices
        let position_sqrt_lower = BigInt(0)
        let position_sqrt_higher = BigInt(0)
        let amount0 = BigInt(0)
        let amount1 = BigInt(0)
        if(tickSpacing){
            position_sqrt_lower = tick_to_sqrt(Number(tick))
            position_sqrt_higher = tick_to_sqrt(Number(tick) + Number(tickSpacing))
        }
        //Calculate amounts based on price
        if(sqrt <= position_sqrt_lower){
            amount0 = getAmount0(liquidity, position_sqrt_higher, position_sqrt_lower)
        } else if(sqrt < position_sqrt_higher) {
            amount0 = getAmount0(liquidity, position_sqrt_higher, sqrt)
            amount1 = getAmount1(liquidity, sqrt, position_sqrt_lower)
        } else {
            amount1 = getAmount1(liquidity, position_sqrt_higher, position_sqrt_lower)
        }
        return([amount0, amount1])
    }

    function getLoanTime(collateral: bigint, interest: bigint, deposit: bigint){
        let delta_seconds = 0n
        if(collateral > 0n && deposit > 0n){
            let yearly_amount = collateral * interest / BigInt(10**6)
            delta_seconds =  deposit * 31536000n / yearly_amount
        } 
        return(delta_seconds)
    }

    function getLoanInterest(collateral: bigint, interest: bigint, start: bigint, end: bigint){
        let delta_seconds = end - start
        let yearly_amount = collateral * interest / BigInt(10**6)
        let delta_interest = yearly_amount * delta_seconds / 31536000n
        return(delta_interest)
    }

/* DESIGN */
    /*Pool selector modal*/
    const [poolShow, setPoolShow] = useState(false)
    const handlePoolClose = () => setPoolShow(false)
    const handlePoolShow = () => setPoolShow(true)

    /*Token selector modal*/
    const [tokenShow, setTokenShow] = useState(false)
    const handleTokenClose = () => setTokenShow(false)
    const handleTokenShow = () => setTokenShow(true)

    /*Borrow modal*/
    const [borrowShow, setBorrowShow] = useState(false)
    const handleBorrowClose = () => setBorrowShow(false)
    const handleBorrowShow = () => setBorrowShow(true)

    const [totalAvailable, setTotalAvailable] = useState(0)
    const [totalCollateral, setTotalCollateral] = useState(0)
    const [totalCollateralMargin, setTotalCollateralMargin] = useState(0)
    const [totalFeeXCol, setTotalFeeXCol] = useState(0)
    const [borrowActive, setBorrowActive] = useState<boolean[]>()

    function borrowAction() {      
        let current = Date.now()
        let multi = multiplier ? BigInt(multiplier) : 0n
        let average_fee = BigInt(Math.ceil((total_fee_x_col / total_collateral)))
        let year_interest = getLoanInterest(BigInt(total_collateral_margin), multi * average_fee, BigInt(Math.floor(current / 1000)), BigInt(Math.floor(current / 1000) + 31536000))
        let start_fee = BigInt(Math.ceil(total_collateral_margin * Number(average_fee) / 10**6))
        let int = (Number(year_interest + start_fee) / 10**token1.decimals).toFixed(rounding((Number(year_interest + start_fee) / 10**token1.decimals), token1.decimals))
        let new_int = parseUnits(int, token1.decimals)
        let new_time = getLoanTime(BigInt(total_collateral_margin), multi * average_fee, new_int - start_fee)
        setAmountNewInterest([int, Number(new_int)])
        setNewInteresTime(Number(new_time))
        setTotalAvailable(total_available)
        setTotalCollateral(total_collateral)
        setTotalCollateralMargin(total_collateral_margin)
        setTotalFeeXCol(total_fee_x_col)
        setBorrowActive(borrow_assets_active)
        handleBorrowShow()
    }

    function borrowSwitch(borrow: any, index: number){
        let current = Date.now()
        let multi = multiplier? BigInt(multiplier) : 0n
        let temp = borrowActive
        if(temp && borrowActive){ 
            temp[index] = !borrowActive[index]
            if(borrowActive[index]){
                let new_collateral = totalCollateral + Number(borrow[3])
                let new_collateral_margin = totalCollateralMargin + Math.ceil(Number(borrow[3]) + Number(borrow[3]) * 1**6 / borrow[0])
                let new_total_fee_x_col = totalFeeXCol + (borrow[0] * Number(borrow[3]))
                let average_fee = BigInt(Math.ceil(new_total_fee_x_col / new_collateral))
                let year_interest = getLoanInterest(BigInt(new_collateral_margin), multi * average_fee, BigInt(Math.floor(current / 1000)), BigInt(Math.floor(current / 1000) + 31536000))
                let start_fee = BigInt(Math.ceil(new_collateral_margin * Number(average_fee) / 10**6))
                let int = (Number(year_interest + start_fee) / 10**token1.decimals).toFixed(rounding((Number(year_interest + start_fee) / 10**token1.decimals), token1.decimals))
                let new_int = parseUnits(int, token1.decimals)
                let new_time = getLoanTime(BigInt(new_collateral_margin), multi * average_fee, new_int - start_fee)
                setAmountNewInterest([int, Number(new_int)])
                setNewInteresTime(Number(new_time))
                setTotalAvailable(totalAvailable + Number(borrow[2]))
                setTotalCollateral(new_collateral)
                setTotalCollateralMargin(new_collateral_margin)
                setTotalFeeXCol(new_total_fee_x_col)
            } else {
                let new_collateral = totalCollateral - Number(borrow[3])
                let new_collateral_margin = totalCollateralMargin - Math.ceil(Number(borrow[3]) + Number(borrow[3]) * 1**6 / borrow[0])
                let new_total_fee_x_col = totalFeeXCol - (borrow[0] * Number(borrow[3]))
                let a_fee_math = Math.ceil(new_total_fee_x_col / new_collateral)
                let average_fee = isNaN(a_fee_math) ? 0n : BigInt(a_fee_math)
                let year_interest = getLoanInterest(BigInt(new_collateral_margin), multi * average_fee, BigInt(Math.floor(current / 1000)), BigInt(Math.floor(current / 1000) + 31536000))
                let start_fee = BigInt(Math.ceil(new_collateral_margin * Number(average_fee) / 10**6))
                let int = (Number(year_interest + start_fee) / 10**token1.decimals).toFixed(rounding((Number(year_interest + start_fee) / 10**token1.decimals), token1.decimals))
                let new_int = parseUnits(int, token1.decimals)
                let new_time = getLoanTime(BigInt(new_collateral_margin), multi * average_fee, new_int - start_fee)
                setAmountNewInterest([int, Number(new_int)])
                setNewInteresTime(Number(new_time))
                setTotalAvailable(totalAvailable - Number(borrow[2]))
                setTotalCollateral(new_collateral)
                setTotalCollateralMargin(new_collateral_margin)
                setTotalFeeXCol(new_total_fee_x_col)
            }
        }       
        setBorrowActive(temp)
    }

    /*Position modal*/
    const [positionShow, setPositionShow] = useState(false)
    const handlePositionClose = () => setPositionShow(false)
    const handlePositionShow = () => setPositionShow(true)
    const [activePosition, setActivePosition] = useState<any>([])

    /*Position adjust input*/
    const [amountInterest, setAmountInterest] = useState(['',0]);  
    const [sliderValue, setSliderValue] = useState(0);

    function interestAdjustInput(e: any){
        let decimals = activePosition[4] ? token0.decimals : token1.decimals
        let new_interest = parseUnits(e.target.value, decimals)
        let multi = multiplier? BigInt(multiplier) : 0n
        let collateral = sliderValue > 0 ? activePosition[2][1] - (BigInt(sliderValue) * activePosition[2][1] / 100n) : activePosition[2][1]
        /* Checks new interest > already used and can only decrease through this method*/
        let current = Date.now()
        let used = getLoanInterest(collateral, multi * BigInt(activePosition[0]), activePosition[2][2], BigInt(Math.floor(current / 1000)))
        if(new_interest > used) {
            let delta = getLoanTime(collateral, multi * BigInt(activePosition[0]), BigInt(new_interest))
            activePosition[5] = delta   
            setAmountInterest([e.target.value, new_interest])
        }
    }
    function handlePosition(position: any){
        let multi = multiplier ? BigInt(multiplier) : 0n
        let collateral = sliderValue > 0 ? position[2][1] - (BigInt(sliderValue) * position[2][1] / 100n) : position[2][1]
        let delta = getLoanTime(collateral, multi * BigInt(position[0]), BigInt(position[2][2]))
        position.push(delta)
        setActivePosition(position)
        if(position[4]){
            setAmountInterest([(Number(position[2][2]) / 10**pool[0].decimals).toFixed(rounding((Number(position[2][2]) / 10**pool[0].decimals), pool[0].decimals)), position[2][2]])
        } else {
            setAmountInterest([(Number(position[2][2]) / 10**pool[1].decimals).toFixed(rounding((Number(position[2][2]) / 10**pool[1].decimals), pool[1].decimals)), position[2][2]])
        }   
        handlePositionShow()
    }

    const handleSliderChange = (e: any) => {
        setSliderValue(Number(e.target.value));
        let multi = multiplier ? BigInt(multiplier) : 0n
        let collateral = Number(e.target.value) > 0 ? activePosition[2][1] - (BigInt(Number(e.target.value)) * activePosition[2][1] / 100n) : activePosition[2][1]
        let delta = getLoanTime(collateral, multi * BigInt(activePosition[0]), BigInt(amountInterest[1]))
        activePosition[5] = delta
    }
    
    /*Card amount input*/
    const [newInteresTime, setNewInteresTime] = useState(0);
    const [amountNewInterest, setAmountNewInterest] = useState(['',0]);
    const [amountToken, setAmountToken] = useState(['',0]);  
    const [switchState, setSwitchState] = useState(supports7702());

    function amountInput(e: any){
        if(e.target.value >= 0){
            setAmountToken([e.target.value, parseUnits(e.target.value, token0.decimals)])
        }
    }    
    function interestIncreaseInput(e: any){
        let multi = multiplier ? BigInt(multiplier) : 0n
        let average_fee = BigInt(Math.ceil(totalFeeXCol / totalCollateral))
        let start_fee = BigInt(Math.ceil(totalCollateralMargin * Number(average_fee) / 10**6))
        let new_int = parseUnits(e.target.value, token1.decimals)
        if(new_int >= start_fee){
            setAmountNewInterest([e.target.value, new_int])
            let new_time = getLoanTime(BigInt(totalCollateralMargin), multi * average_fee, new_int - start_fee)
            setNewInteresTime(Number(new_time))
        } else {
            setAmountNewInterest([(Number(start_fee) / 10**token1.decimals).toFixed(rounding((Number(start_fee) / 10**token1.decimals), token1.decimals)), Number(start_fee)])
            let new_time = getLoanTime(BigInt(totalCollateralMargin), multi * average_fee, 0n)
            setNewInteresTime(Number(new_time))
        }
    }

    /*Card borrow button*/
    const { connectors, connect } = useConnect()
    const connector_button = connectors.map((connector) => (
        <Button
            variant="custom"
            key={connector.uid}
            onClick={() => connect({ connector })}
            className="button-main"
        >
            Connect
        </Button>
    ))
    const borrow_button = (
        <Button variant="custom" className="button-main" onClick={borrowAction} disabled={Number(amountToken[0]) <= 0}>
            Borrow
        </Button> 

    )
    function Connection(){     
        if(account.status === 'disconnected')  {
            return connector_button[0]
        } else {
            return borrow_button  
        }
    }

    /*Pool selector list*/
    const [firstToken, setFirstToken] = useState<Boolean>(true)
    const chainId_Tokens: any[] = []
    function getTokens() {
        let used: any[] = []
        for(const key in Tokens){
            if(Tokens[key].chainId == chainId && !used.includes(Tokens[key].address)){
                //check ipfs url
                if(Tokens[key].logoURI.substring(0, 7) == "ipfs://"){
                    Tokens[key].logoURI = "https://ipfs.io/ipfs/"+Tokens[key].logoURI.slice(7)
                }
                chainId_Tokens.push(Tokens[key])
                used.push(Tokens[key].address)
            }
        }
        if(chainId_Tokens.length > 1 && token0.name == ""){
            let temp0 = chainId_Tokens[0].address < chainId_Tokens[1].address ? chainId_Tokens[0] : chainId_Tokens[1]
            let temp1 = chainId_Tokens[0].address < chainId_Tokens[1].address ? chainId_Tokens[1] : chainId_Tokens[0]
            setToken0(chainId_Tokens[0])
            setToken1(chainId_Tokens[1])
            setPool([temp0, temp1])
        }
    }
    getTokens()

    function selectToken(input: Boolean) {
        setFirstToken(input)
        handleTokenShow()
    }
    function switchTokens(){
        let temp0 = token0
        let temp1 = token1
        setToken0(temp1)
        setToken1(temp0)
    }
    function setToken(token: any) {
        if(firstToken){
            setToken0(token)
            let temp0 = token.address < token1.address ? token : token1
            let temp1 = token.address < token1.address ? token1 : token
            setPool([temp0, temp1])
        } else {
            setToken1(token)
            let temp0 = token.address < token0.address ? token : token0
            let temp1 = token.address < token0.address ? token0 : token
            setPool([temp0, temp1])
        }
        handleTokenClose()
    }
    const PoolItems = 
        <div> 
            <Row style={{margin: '5px'}}>
                <Col className="d-grid gap-1">
                    <Button className="button-token-left" variant="outline-secondary" onClick={() => selectToken(true)}>
                        <img
                            src={token0.logoURI} 
                            width={25} 
                            height={25}
                            onError={(e) => {
                                const img = e.currentTarget;
                                img.onerror = null; 
                                img.src = generateTokenLogo(token0.symbol);
                            }}
                            style={{ borderRadius: 60 }}/> {token0.symbol} 
                    </Button>
                </Col> 
                <Col xs={2} className="d-grid gap-1">
                    <Button className="button-token-center" variant="white" onClick={switchTokens}>
                        <IoSwapHorizontalSharp />
                    </Button>
                </Col>
                <Col className="d-grid gap-1">
                    <Button className="button-token-left" variant="outline-secondary" onClick={() => selectToken(false)}>
                        
                        <img
                            src={token1.logoURI} 
                            width={25} 
                            height={25}
                            onError={(e) => {
                                const img = e.currentTarget;
                                img.onerror = null; 
                                img.src = generateTokenLogo(token1.symbol);
                            }}
                            style={{ borderRadius: 60 }}/> {token1.symbol}
                            
                    </Button>
                </Col> 
                
            </Row>
        </div>
    const TokenItems = chainId_Tokens.map((Token, index) =>
        <div key={index}> 
            <Row style={{margin: '5px'}}>
                {!firstToken && Token.address == token0.address || firstToken && Token.address == token1.address ?
                    <Button className="button-token-left" variant="white" onClick={() => setToken(Token)} disabled>   
                        <img
                            src={Token.logoURI} 
                            width={25} 
                            height={25}
                            onError={(e) => {
                                const img = e.currentTarget;
                                img.onerror = null; 
                                img.src = generateTokenLogo(Token.symbol);
                            }}
                            style={{ borderRadius: 60 }}/> {Token.symbol} 
                    </Button>
                    :
                    <Button className="button-token-left" variant="white" onClick={() => setToken(Token)}>   
                        <img
                            src={Token.logoURI} 
                            width={25} 
                            height={25}
                            onError={(e) => {
                                const img = e.currentTarget;
                                img.onerror = null; 
                                img.src = generateTokenLogo(Token.symbol);
                            }}
                            style={{ borderRadius: 60 }}/> {Token.symbol} 
                    </Button>
                }
            </Row>
        </div>
    )

/* WEB3 FUNCTIONS */
    const [offset, setOffset] = useState(0);
    const [lastoffset, setLastoffset] = useState(0);
    const [minmax, setMinmax] = useState([0,0]);
    const [expArray, setExpArray] = useState<any>([]);
    const [poolExpArray, setPoolExpArray] = useState<any>([]);

    /* Web3 read functions */
    const chainId_Factories_list: any = {}
    function getFactories() {
        for(const key in Factory_Locations){
            if(Factory_Locations[key].chainId == chainId){
                chainId_Factories_list[Factory_Locations[key].ContractName] = Factory_Locations[key]
            }
        }
    }
    getFactories()
    let uniswapFactoryAddress
    let kommodoFactoryAddress: any       
    try{
        uniswapFactoryAddress = chainId_Factories_list.UniswapV3Factory.ContractAddress
        kommodoFactoryAddress = chainId_Factories_list.KommodoFactory.ContractAddress
    } catch { console.log("no available uni and/or kommodo factory") }
    const { data: multiplier } = useReadContract({
        abi: Kommodo_Factory_abi,
        address: kommodoFactoryAddress,
        functionName: 'multiplier',
    })
    let { data: balance0 } = useReadContract({
        abi: ERC20_abi,
        address: pool[0].address as Address,
        functionName: 'balanceOf',
        args: [account.address as Address]
    })
    let { data: balance1 } = useReadContract({
        abi: ERC20_abi,
        address: pool[1].address as Address,
        functionName: 'balanceOf',
        args: [account.address as Address]
    })

    const price_loop = 5
    let kommodo: any = {}
    let spacing: any = {}
    let allowance_borrow: any = {} 
    let allowance_collateral: any = {} 
    let liquidity: any = {}
    let locked: any = {}
    let prices: any = {}
    let borrow_positions: any = []
    
    let min_max_price: any = [offset,offset]
    let poolPriceExpIndex: any = []
    let kommodo_addresses: any = []
    let exp_array: any = []

    for(const index in fees){
        const { data: uniPoolAddress } = useReadContract({
            abi: UniV3_Factory_abi,
            address: uniswapFactoryAddress,
            functionName: 'getPool',
            args: [pool[0].address as Address, pool[1].address as Address, fees[index]]
        })
        const { data: kommodoPoolAddress } = useReadContract({
            abi: Kommodo_Factory_abi,
            address: kommodoFactoryAddress,
            functionName: 'kommodo',
            args: [pool[0].address as Address, pool[1].address as Address, fees[index] ]
        })
        if(kommodoPoolAddress != "0x0000000000000000000000000000000000000000"){
            kommodo_addresses.push([kommodoPoolAddress, fees[index]])
        }
        let { data: _allowance_borrow } = useReadContract({
            abi: ERC20_abi,
            address: token0.address as Address,
            functionName: 'allowance',
            args: [account.address as Address, kommodoPoolAddress as Address]
        })
        let { data: _allowance_collateral } = useReadContract({
            abi: ERC20_abi,
            address: token1.address as Address,
            functionName: 'allowance',
            args: [account.address as Address, kommodoPoolAddress as Address]
        })
        const { data: _slot0 } = useReadContract({
            abi: UniV3_Pool_abi,
            address: uniPoolAddress as Address,
            functionName: 'slot0',
        })
        const { data: tickSpacing } = useReadContract({
            abi: Kommodo_Pool_abi,
            address: kommodoPoolAddress as Address,
            functionName: 'tickSpacing',
        }) 

        spacing[fees[index]] = tickSpacing 
        if(kommodoPoolAddress != undefined && kommodoPoolAddress != "0x0000000000000000000000000000000000000000"){
            kommodo[fees[index]] = kommodoPoolAddress
            allowance_borrow[fees[index]] = _allowance_borrow
            allowance_collateral[fees[index]] = _allowance_collateral
        }

        //let slot0_tick = 0
        let slot0_price = 0
        if(_slot0 && tickSpacing && (_slot0[0] != slot0[0] || lastoffset != offset)){
            setSlot0(_slot0)
            setLastoffset(offset)
            //let slot0_tick = _slot0[1]
            slot0_price = sqrt_to_price(Number(_slot0[0]))
            let exp_index = price_close_log_index(slot0_price)
            exp_array = get_prices(Number(exp_index[0]), Number(exp_index[1]), offset, price_loop, Number(tickSpacing))
            let lowest: any = [0,0,0]
            let highest: any = [0,0,0]
            if(exp_array != expArray){
                lowest = exp_array[exp_array.length - 2] < lowest || lowest[0] == 0 ? exp_array[exp_array.length - 2] : lowest
                highest = exp_array[exp_array.length - 1] > highest || highest[0] == 0 ? exp_array[exp_array.length - 1] : highest
                i = 0
                while(i < exp_array.length){
                    let array = exp_array[i]
                    array.push(fees[index])
                    poolPriceExpIndex.push(array)
                    i += 1
                }
                setPoolExpArray(poolPriceExpIndex)
                setExpArray(exp_array)
            }
            min_max_price = [lowest[0], highest[0]]
            if(min_max_price != minmax){
                setMinmax(min_max_price)
            }
        }
    }
    let poolexparray = poolExpArray
    /*generate the borrow overview for user */
    let v = 0 
    let keys0 = []
    let keys1 = []
    if(account.address){
        while(v < poolexparray.length){
            const encodedData0 = encodeAbiParameters(
                [
                    { name: 'x', type: 'address' },
                    { name: 'y', type: 'int24' },
                    { name: 'z', type: 'bool' }
                ],
                [account.address as Address, poolexparray[v][3], false]
            )
            let key0 = keccak256(encodedData0)
            keys0.push(key0)
            const encodedData1 = encodeAbiParameters(
                [
                    { name: 'x', type: 'address' },
                    { name: 'y', type: 'int24' },
                    { name: 'z', type: 'bool' }
                ],
                [account.address as Address, poolexparray[v][3], true]
            )
            let key1 = keccak256(encodedData1)
            keys1.push(key1)
            v += 1
        }
    }

    const contracts_positions0 = useMemo(
        () =>
            kommodo_addresses.flatMap((kommodo: any) =>
                keys0.map((key0: any) => ({
                    address: kommodo[0],
                    abi: Kommodo_Pool_abi,
                    functionName: 'borrower',
                    args: [key0],
                }))
            ),
        [kommodo_addresses, keys0]
    )
    const { data: positions0 } = useReadContracts({
        contracts: contracts_positions0,
        query: {
            enabled: poolexparray.length > 0,
        },
    })
    const contracts_positions1 = useMemo(
        () =>
            kommodo_addresses.flatMap((kommodo: any) =>
                keys1.map((key1: any) => ({
                    address: kommodo[0],
                    abi: Kommodo_Pool_abi,
                    functionName: 'borrower',
                    args: [key1],
                }))
            ),
        [kommodo_addresses, keys0]
    )
    const { data: positions1 } = useReadContracts({
        contracts: contracts_positions1,
        query: {
            enabled: poolexparray.length > 0,
        },
    })
    if(positions0 && positions1){
        i = 0
        while(i < positions0.length){
            let position0 = positions0[i].result as any
            let position1 = positions1[i].result as any
            let loop_index = i % poolexparray.length
            let tick = poolexparray[loop_index][3]
            let price = poolexparray[loop_index][0]
            let fee = poolexparray[loop_index][4]
            let tickSpacing = spacing[fee]
            if(position0 && position0[3] != 0n){
                let value = liquidity_to_token_amount(position0[0], slot0[0], tick, BigInt(tickSpacing))
                borrow_positions.push([fee, price, position0, value, false])
            }
            if(position1 && position1[3] != 0n){
                let value = liquidity_to_token_amount(position1[0], slot0[0], tick, BigInt(tickSpacing))
                borrow_positions.push([fee, price, position1, value, true])
            }
            i += 1
        } 
    }

    /*generates the assets overview for all pools*/
    const contracts_assets = useMemo(
        () =>
            kommodo_addresses.flatMap((kommodo: any) =>
                poolexparray.map((exp: any) => ({
                    address: kommodo[0],
                    abi: Kommodo_Pool_abi,
                    functionName: 'assets',
                    args: [exp[3]],
                }))
            ),
        [kommodo_addresses, poolexparray]
    )
    const { data: assets } = useReadContracts({
        contracts: contracts_assets,
        query: {
            enabled: poolexparray.length > 0,
        },
    })

    var _liquidity: any = {}
    var _locked: any = {}
    var _price: any = {}
    if(assets){
        i = 0
        while(i < assets.length){
            let loop_index = i % poolexparray.length
            let pool_index = Math.floor(i / poolexparray.length)
            let fee = kommodo_addresses[pool_index][1]
            let tick = poolexparray[loop_index][3]
            let result: any = assets[i].result as Number
            if(result && fee == poolexparray[loop_index][4]){
                _liquidity[tick] = result[0]
                _locked[tick] = result[1]
                _price[tick] = poolexparray[loop_index][0]
            }
            if(loop_index == poolexparray.length - 1){
                liquidity[fee] = _liquidity
                locked[fee] = _locked
                prices[fee] = _price
                //reset for new pool
                _liquidity = {}     
                _locked = {}
                _price = {}
            }
            i += 1
        }
    }

    /* Get available borrow prices and all pools */
    let borrow_assets_active: boolean[] = []
    let borrow_assets: any = []
    let total_available = 0
    let total_collateral = 0
    let total_collateral_margin = 0 // BigInt(Math.ceil(Number(total_collateral) + Number(total_collateral) * 1**6 / fee))
    let total_fee_x_col = 0
    for(const index in fees){
        let amount_request = amountToken[1]
        //Store available for borrow
        if(fees[index] in liquidity && amount_request != 0){
            const iterator = Object.keys(liquidity[fees[index]]);
            for (const key of iterator) {
                let tick = BigInt(key)
                let price = prices[fees[index]][key]
                let lock = locked[fees[index]][key]
                let liq = liquidity[fees[index]][key]
                let sqrt_current = slot0[0]
                let free = liq - lock
                let amounts = liquidity_to_token_amount(BigInt(free), sqrt_current, tick, spacing[fees[index]])
                if(token0.address == pool[0].address && amounts[0] > 0){
                    if(amounts[0] <= BigInt(amount_request)){
                        let collateral = getAmount1(BigInt(free), tick_to_sqrt(Number(tick) + spacing[fees[index]]), tick_to_sqrt(Number(tick)))
                        //check max collateral
                        if(balance1 && collateral > balance1){
                            //Max 90% balance for interest and margin
                            let balance1_ = balance1 / 100n * 90n
                            let new_liq = BigInt(free) * balance1_ / collateral
                            let new_amounts = liquidity_to_token_amount(new_liq, sqrt_current, tick, spacing[fees[index]])
                            let new_coll = getAmount1(new_liq, tick_to_sqrt(Number(tick) + spacing[fees[index]]), tick_to_sqrt(Number(tick)))
                            borrow_assets_active.push(true)
                            borrow_assets.push([fees[index], price, new_amounts[0], new_coll, tick, new_liq])
                            total_available += Number(new_amounts[0])
                            total_collateral += Number(new_coll)
                            total_collateral_margin += Math.ceil(Number(new_coll) + Number(new_coll) * 1**6 / fees[index])
                            total_fee_x_col += fees[index] * Number(new_coll)
                            amount_request = 0
                        } else {
                            borrow_assets_active.push(true)
                            borrow_assets.push([fees[index], price, amounts[0], collateral, tick, BigInt(free)])
                            total_available += Number(amounts[0])
                            total_collateral += Number(collateral)
                            total_collateral_margin += Math.ceil(Number(collateral) + Number(collateral) * 1**6 / fees[index])
                            total_fee_x_col += fees[index] * Number(collateral)
                            amount_request = Number(amount_request) - Number(amounts[0]) 
                        }
                    } else {
                        let liq_available = BigInt(free) * BigInt(amount_request) / amounts[0] 
                        let collateral = getAmount1(BigInt(liq_available), tick_to_sqrt(Number(tick) + spacing[fees[index]]), tick_to_sqrt(Number(tick)))
                        if(balance1 && collateral > balance1){
                            //Max 90% balance for interest and margin
                            let balance1_ = balance1 / 100n * 90n
                            let new_liq = BigInt(liq_available) * balance1_ / collateral
                            let new_amounts = liquidity_to_token_amount(new_liq, sqrt_current, tick, spacing[fees[index]])
                            let new_coll = getAmount1(new_liq, tick_to_sqrt(Number(tick) + spacing[fees[index]]), tick_to_sqrt(Number(tick)))
                            borrow_assets_active.push(true)
                            borrow_assets.push([fees[index], price, new_amounts[0], collateral, tick, new_liq])
                            total_available += Number(new_amounts[0])
                            total_collateral += Number(new_coll)
                            total_collateral_margin += Math.ceil(Number(new_coll) + Number(new_coll) * 1**6 / fees[index])
                            total_fee_x_col += fees[index] * Number(new_coll)
                            amount_request = 0
                        } else {
                            borrow_assets_active.push(true)
                            borrow_assets.push([fees[index], price, amount_request, collateral, tick, BigInt(liq_available)])
                            total_available += Number(amount_request)
                            total_collateral += Number(collateral)
                            total_collateral_margin += Math.ceil(Number(collateral) + Number(collateral) * 1**6 / fees[index])
                            total_fee_x_col += fees[index] * Number(collateral)
                            amount_request = 0
                        }
                    }
                } else if (token0.address != pool[0].address && amounts[1] > 0){
                    if(amounts[1] <= BigInt(amount_request)){
                        let collateral = getAmount0(BigInt(free), tick_to_sqrt(Number(tick) + spacing[fees[index]]), tick_to_sqrt(Number(tick)))
                        if(balance0 && collateral > balance0){
                            //Max 90% balance for interest and margin
                            let balance0_ = balance0 / 100n * 90n
                            let new_liq = BigInt(free) * balance0_ / collateral
                            let new_amounts = liquidity_to_token_amount(new_liq, sqrt_current, tick, spacing[fees[index]])
                            let new_coll = getAmount0(new_liq, tick_to_sqrt(Number(tick) + spacing[fees[index]]), tick_to_sqrt(Number(tick)))
                            borrow_assets_active.push(true)
                            borrow_assets.push([fees[index], price, new_amounts[1], new_coll, tick, new_liq])
                            total_available += Number(new_amounts[1])
                            total_collateral += Number(new_coll)
                            total_collateral_margin += Math.ceil(Number(new_coll) + Number(new_coll) * 1**6 / fees[index])
                            total_fee_x_col += fees[index] * Number(new_coll)
                            amount_request = 0
                        } else {
                            borrow_assets_active.push(true)
                            borrow_assets.push([fees[index], price, amounts[1], collateral, tick, BigInt(free)])
                            total_available += Number(amounts[1])
                            total_collateral += Number(collateral)
                            total_collateral_margin += Math.ceil(Number(collateral) + Number(collateral) * 1**6 / fees[index])
                            total_fee_x_col += fees[index] * Number(collateral)
                            amount_request = Number(amount_request) - Number(amounts[1])
                        }
                    } else {
                        let liq_available = BigInt(free) * BigInt(amount_request) / amounts[1] 
                        let collateral = getAmount0(BigInt(liq_available), tick_to_sqrt(Number(tick) + spacing[fees[index]]), tick_to_sqrt(Number(tick)))
                        if(balance0 && collateral > balance0){
                            //Max 90% balance for interest and margin
                            let balance0_ = balance0 / 100n * 90n
                            let new_liq = BigInt(liq_available) * balance0_ / collateral
                            let new_amounts = liquidity_to_token_amount(new_liq, sqrt_current, tick, spacing[fees[index]])
                            let new_coll = getAmount0(new_liq, tick_to_sqrt(Number(tick) + spacing[fees[index]]), tick_to_sqrt(Number(tick)))
                            borrow_assets_active.push(true)
                            borrow_assets.push([fees[index], price, new_amounts[1], collateral, tick, new_liq])
                            total_available += Number(new_amounts[1])
                            total_collateral += Number(new_coll)
                            total_collateral_margin += Math.ceil(Number(new_coll) + Number(new_coll) * 1**6 / fees[index])
                            total_fee_x_col += fees[index] * Number(new_coll)
                            amount_request = 0
                        } else {
                            borrow_assets_active.push(true)
                            borrow_assets.push([fees[index], price, amount_request, collateral, tick, BigInt(liq_available)])
                            total_available += Number(amount_request)
                            total_collateral += Number(collateral)
                            total_collateral_margin += Math.ceil(Number(collateral) + Number(collateral) * 1**6 / fees[index])
                            total_fee_x_col += fees[index] * Number(collateral)
                            amount_request = 0
                        }
                    }
                }  
            }
        }
    }

    /* Web3 write functions */
    function supports7702(): boolean {
        if(eip702chains.includes(chainId)){
            return true
        } else {
            return false
        }
    }

    const { sendCalls, data } = useSendCalls()
    const { writeContract, data: hash, isPending: isWriting} = useWriteContract()
    const { isLoading: isConfirming, isSuccess: _isConfirmed } = useWaitForTransactionReceipt( {hash} )

    const {data: callsStatus, isLoading: _isConfirming} = useCallsStatus({
        id: data?.id!,
        query: {
            enabled: !!data?.id,
            refetchInterval: (query) =>
                query.state.data?.status === 'pending' ? 1000 : false,
        }, 
    })  
    let isConfirmingBatch = callsStatus?.status === 'pending' 
    
    const [nextText, setNextTxt] = useState(0)
    const [approvals, setApprovals] = useState<any>([])
    useEffect(() => {
        if (approvals.length != 0 && _isConfirmed && !approvals[nextText]) {
            let temp = approvals
            temp[nextText] = true
            setApprovals(temp)
        } else if (_isConfirmed || callsStatus?.status == 'success'){
            if(batch_txt == 0 || nextText + 1 == batch_txt || switchState){
                window.location.reload()
            } else {
                setNextTxt(nextText + 1)
            }
        } 
    }, [_isConfirmed,
        callsStatus,
        setApprovals,
        setNextTxt
    ])

    /* Approval */
    const max_allowance = "115792089237316195423570985008687907853269984665640564039457584007913129639935"
    let _approvals = []
    let borrows = []
    let borrows_fee = []
    let batch_txt = 0
    if(borrowActive){
        let array_lenght = borrowActive.length
        for (var i = 0; i < array_lenght; i++) {
            const borrowParams: any = []
            //Only add active borrows
            if(borrowActive[i] && borrow_assets[i]){
                if(borrow_assets[i][0] in allowance_collateral){
                    if(allowance_collateral[borrow_assets[i][0]] == max_allowance){
                        _approvals.push(true) 
                    } else if (allowance_collateral[borrow_assets[i][0]] > borrow_assets[i][3]){
                        allowance_collateral[borrow_assets[i][0]] -= borrow_assets[i][3]
                        _approvals.push(true) 
                    } else {
                        _approvals.push(false)
                    } 
                } else {
                    _approvals.push(false)
                }
                let col_inc_margin = BigInt(Math.ceil(Number(borrow_assets[i][3]) + Number(borrow_assets[i][3]) * 1**6 / borrow_assets[i][0]))
                let min_amount = BigInt(borrow_assets[i][2]) * (10n**6n -1n) / 10n**6n
                let collateralA = token0.address == pool[0].address ? false : true
                borrowParams.push(collateralA) //borrowParams[0] - token0;  
                borrowParams.push(borrow_assets[i][4]) //borrowParams[1] - tickBor; 
                borrowParams.push(borrow_assets[i][5]) //borrowParams[2] - liquidityBor;
                if(token0.address == pool[0].address){
                    borrowParams.push(min_amount) //borrowParams[3] - borAMin;
                    borrowParams.push(BigInt(0)) //borrowParams[4] - borBMin; 
                    borrowParams.push(col_inc_margin) //borrowParams[5] - colAmount; 
                } else {
                    borrowParams.push(BigInt(0)) //borrowParams[3] - borAMin;
                    borrowParams.push(min_amount) //borrowParams[4] - borBMin; 
                    borrowParams.push(col_inc_margin) //borrowParams[5] - colAmount; 
                }
                let average_total_fee = BigInt(Math.ceil(totalFeeXCol / totalCollateral))
                let partial_fee = BigInt(amountNewInterest[1]) * borrow_assets[i][3] * BigInt(borrow_assets[i][0]) / (BigInt(totalCollateral) * average_total_fee)
                let start_fee = BigInt(Math.ceil(Number(borrow_assets[i][3]) * borrow_assets[i][0] / 10**6))
                borrowParams.push(partial_fee - start_fee) //borrowParams[6] - interest; 
                borrows.push(borrowParams)
                borrows_fee.push(borrow_assets[i][0])
                batch_txt += 1      
            }
        }
        if(_approvals.length != approvals.length){
            setApprovals(_approvals)
        }
    }
    const { data: approveConfig } = useSimulateContract({
        abi: ERC20_abi,
        address: token1.address as Address,
        functionName: 'approve',
        args: [kommodo[borrows_fee[nextText]] as Address, parseUnits(max_allowance, 0)],
        query: {
            enabled: batch_txt > 0 && !approvals[nextText], 
        },
    })
    const { data: borrowOpenConfig } = useSimulateContract({
        abi: Kommodo_Pool_abi,
        address: kommodo[borrows_fee[nextText]] as Address,
        functionName: 'open',
        args: [borrows[nextText]],
        query: {
            enabled: batch_txt > 0  && approvals[nextText], // Enabled only if approval is not needed
        },
    })
    const borrowBatchCall: any = []
    for (var i = 0; i < batch_txt; i++) {
        const approveCall = {
            to: token1.address as Address,
            data: encodeFunctionData({
                abi: ERC20_abi,
                functionName: 'approve',
                args: [kommodo[borrows_fee[i]] as Address, parseUnits(max_allowance, 0)],
            }),
        } 
        if(!approvals[i]){borrowBatchCall.push(approveCall)}
        const borrowCall = {
            to: kommodo[borrows_fee[i]] as Address,
            data: encodeFunctionData({
                abi: Kommodo_Pool_abi,
                functionName: 'open',
                args: [borrows[i]],
            }),
        } 
        borrowBatchCall.push(borrowCall)
    }
    const canBatch = supports7702()
    const handleBorrow = async() => {
        const calls = borrowBatchCall.filter(Boolean)
        if (canBatch && switchState) {
            await sendCalls({ calls },
                {
                    onSuccess: () => {
                        handleBorrowClose()
                    },
                    onError: (err) => {
                        console.log(err)  
                    }
                }
            )
        } else if (!approvals[nextText] && approveConfig?.request) {
            writeContract(approveConfig.request,
                {
                    onSuccess: () => {
                        console.log("success")
                    },
                    onError: (err) => {
                        console.log(err)  
                    }
                }
            )
        } else if(borrowOpenConfig?.request) {
            writeContract(borrowOpenConfig.request,
                {
                    onSuccess: () => {
                        if(nextText + 1 == batch_txt){
                            handleBorrowClose()
                        } 
                    },
                    onError: (err) => {
                        console.log(err)  
                    }
                }
            )
        }
    }

    /* (Partial) close borrow */
    let closeBorrowFee = 0
    const [approvalClose, setApprovalClose] = useState<any>([false, false])
    let approval_close = [false, false]
    const adjustBorrowParams: any = []
    let sqrt_position
    let tick_position = 0n
    let collatera_token0 = false
    //slippage amounts
    let max_amountA = activePosition[3] ? BigInt(sliderValue) * BigInt(activePosition[3][0]) * 10n**6n / (10n**6n -1n) : 0n
    let max_amountB = activePosition[3] ? BigInt(sliderValue) * BigInt(activePosition[3][1]) * 10n**6n / (10n**6n -1n) : 0n
    if(activePosition[2]) {
        collatera_token0 = activePosition[4]
        sqrt_position = price_to_sqrt(activePosition[1])
        tick_position = sqrt_to_tick(sqrt_position, spacing[activePosition[0]])
        adjustBorrowParams.push(collatera_token0) //AdjustParams[0] - token0
        adjustBorrowParams.push(tick_position) //AdjustParams[1] - tickBor
        adjustBorrowParams.push(BigInt(sliderValue) * activePosition[2][0] / 100n) //AdjustParams[2] - liquidityBor           
        adjustBorrowParams.push(max_amountA) //AdjustParams[3] - borAMax
        adjustBorrowParams.push(max_amountB) //AdjustParams[4] - borBMax
        adjustBorrowParams.push(BigInt(sliderValue) * activePosition[2][1] / 100n) //AdjustParams[5] - amountCol
        adjustBorrowParams.push(BigInt(amountInterest[1])-activePosition[2][2]) //AdjustParams[6] - interest 
        closeBorrowFee = activePosition[0]
        if(token0.address == pool[0].address){
            if(activePosition[3][0] == 0 || allowance_borrow[activePosition[0]] > activePosition[3][0]){approval_close[0]=true}
            if(activePosition[3][1] == 0 || allowance_collateral[activePosition[0]] > activePosition[3][1]){approval_close[1]=true}
        } else {
            if(activePosition[3][1] == 0 || allowance_borrow[activePosition[0]] > activePosition[3][1]){approval_close[1]=true}
            if(activePosition[3][0] == 0 || allowance_collateral[activePosition[0]] > activePosition[3][0]){approval_close[0]=true}
        }
        if(approval_close[0] != approvalClose[0] || approval_close[1] != approvalClose[1]){
            setApprovalClose(approval_close)
        }
    } 

    const { data: approve0CloseConfig } = useSimulateContract({
        abi: ERC20_abi,
        address: pool[0].address as Address,
        functionName: 'approve',
        args: [kommodo[closeBorrowFee] as Address, parseUnits(max_allowance, 0)],
        query: {
            enabled: !approvalClose[0], 
        },
    })
    const { data: approve1CloseConfig } = useSimulateContract({
        abi: ERC20_abi,
        address: pool[1].address as Address,
        functionName: 'approve',
        args: [kommodo[closeBorrowFee] as Address, parseUnits(max_allowance, 0)],
        query: {
            enabled: !approvalClose[1], 
        },
    })
    const { data: borrowAdjustConfig } = useSimulateContract({
            abi: Kommodo_Pool_abi,
            address: kommodo[closeBorrowFee] as Address,
            functionName: 'adjust',
            args: [adjustBorrowParams],
            query: {
                enabled: approvalClose[0] && approvalClose[1] && sliderValue != 100, // Enabled only if approval is not needed and adjustment
            },    
    })

    const closeBorrowParams: any = []
    if(activePosition[2]) {
        collatera_token0 = activePosition[4]
        sqrt_position = price_to_sqrt(activePosition[1])
        tick_position = sqrt_to_tick(sqrt_position, spacing[activePosition[0]])
        closeBorrowParams.push(collatera_token0) //CloseParams[0] - token0
        closeBorrowParams.push(account.address) //CloseParams[1] - owner
        closeBorrowParams.push(Number(tick_position)) //CloseParams[2] - tickBor
        closeBorrowParams.push(max_amountA) //CloseParams[3] - borAMax
        closeBorrowParams.push(max_amountB) //CloseParams[4] - borBMax
    }

    const { data: borrowCloseConfig } = useSimulateContract({
            abi: Kommodo_Pool_abi,
            address: kommodo[closeBorrowFee] as Address,
            functionName: 'close',
            args: [closeBorrowParams],
            query: {
                enabled: approvalClose[0] && approvalClose[1] && sliderValue == 100, // Enabled only if approval is not needed and full close
            },    
    })

    const handleCloseBorrow = () => {
        if (approve0CloseConfig?.request){
            writeContract(approve0CloseConfig.request,
                {
                    onSuccess: () => {
                        setApprovalClose([true, approvalClose[1]])
                    },
                    onError: (err) => {
                        console.log(err)  
                    }
                })
        } else if (approve1CloseConfig?.request){
            writeContract(approve1CloseConfig.request,
                {
                    onSuccess: () => {
                        setApprovalClose([approvalClose[0], true])
                    },
                    onError: (err) => {
                        console.log(err)  
                    }
                })
        } else if (borrowAdjustConfig?.request) {
            writeContract(borrowAdjustConfig.request,
                {
                    onSuccess: () => {
                        handlePositionClose()
                    },
                    onError: (err) => {
                        console.log(err)  
                    }
                }
            )
        } else if (borrowCloseConfig?.request) {
            writeContract(borrowCloseConfig.request,
                {
                    onSuccess: () => {
                        handlePositionClose()
                    },
                    onError: (err) => {
                        console.log(err)  
                    }
                }
            )
        }   
    }

/* Design after */
    /* Borrow modal list generator */
    const LowestFeeItems = borrow_assets.map((borrow: any, index: number) =>
        <div key={borrow}>          
            <ListGroup.Item >
                <Row>
                    <Col xs={2} className="d-flex align-items-center"  style={{ minWidth: "0" }}>
                        <Balancer>
                            {
                            (convert_price(borrow[1], token0.address == pool[0].address)).toLocaleString(undefined,{minimumFractionDigits: (rounding(convert_price(borrow[1], token0.address == pool[0].address), 12))})     
                            }
                        </Balancer>
                    </Col>
                    <Col>{(Number(borrow[2]) / 10**token0.decimals).toLocaleString(undefined,{minimumFractionDigits: rounding(Number(borrow[2]) / 10**token0.decimals, token0.decimals)})} </Col> 
                    <Col>{(Math.ceil((Number(borrow[3]) + (Number(borrow[3]) * 1**6 / borrow[0]))) / 10**token1.decimals).toLocaleString(undefined,{minimumFractionDigits: rounding(Math.ceil(Number(borrow[3]) + (Number(borrow[3]) * 1**6 / borrow[0])) / 10**token1.decimals, token1.decimals)})} </Col>
                    <Col>{Number(multiplier) * borrow[0] / 10000} %</Col>
                    <Col xs={1}>
                        <Form.Check // prettier-ignore
                            type='checkbox'
                            defaultChecked={borrow_assets_active[index]}
                            onClick={() => borrowSwitch(borrow, index)}
                        />
                    </Col>
                </Row>
            </ListGroup.Item>
        </div>
    );

    const types = ["Lowest interest"];
    const BorrowItems = types.map((type) =>
        <div key={type}>
            <Accordion.Item eventKey={type.toString()}>
                <Accordion.Header>
                    {type}
                </Accordion.Header>
                <Accordion.Body>
                    {totalAvailable / 10**token0.decimals < Number(amountToken[0]) 
                            ? <Alert variant="danger" className="text-center">
                                Max borrow: { 
                                    (totalAvailable / 10**token0.decimals).toLocaleString(undefined,{minimumFractionDigits: (rounding(totalAvailable / 10**token0.decimals, token0.decimals))})
                                } {token0.symbol} 
                             </Alert>
                            : ""
                    }
                    <ListGroup.Item>
                        <Row className="mb-2">
                            <Col xs={2}>Price</Col>
                            <Col>Borrow</Col>
                            <Col>Collateral</Col>
                            <Col>Interest</Col>
                            <Col xs={1}></Col>
                        </Row>
                    </ListGroup.Item>
                    {LowestFeeItems}
                    <Row className="mb-4"/>
                    <ListGroup.Item>
                        <Row className="mb-2">
                            <Col>
                                Total borrow
                            </Col>
                            <Col>
                                {(totalAvailable / 10**token0.decimals).toLocaleString(undefined,{minimumFractionDigits: (rounding(totalAvailable / 10**token0.decimals, token0.decimals))})} 
                            </Col>
                            <Col xs={3}>
                                <Form.Text muted>{token0.symbol}</Form.Text>
                            </Col>
                        </Row>
                        <Row className="mb-2">
                            <Col>
                                Total collateral
                            </Col>
                            <Col>
                                 { 
                                 (totalCollateralMargin / 10**token1.decimals).toLocaleString(undefined,{minimumFractionDigits: (rounding(totalCollateralMargin / 10**token1.decimals, token1.decimals))})
                                 } 
                            </Col>
                            <Col xs={3}>
                                <Form.Text muted>{token1.symbol}</Form.Text>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                Interest deposit
                            </Col>
                            <Col>
                            <InputGroup className="mb-3">
                                <Form.Control type="number" size="sm" placeholder="0" className="form-control-plaintext" value={amountNewInterest[0]} onChange={interestIncreaseInput}/>
                            </InputGroup>
                            </Col>
                            <Col xs={3}>
                                <Form.Text muted>{token1.symbol}</Form.Text>
                            </Col>
                        </Row>
                        <Row className="mb-2" style={{textAlign:"center"}}>
                            <Alert  variant="custom">
                                {new Date(Date.now() + newInteresTime * 1000).toLocaleString()}
                            </Alert>
                        </Row>
                    </ListGroup.Item>
                    <Row>
                        <Button variant="custom" className="button-margin" disabled={isWriting || isConfirmingBatch || isConfirming} onClick={handleBorrow}>
                            {isWriting ? 'Confirming in wallet...' 
                                : isConfirming || isConfirmingBatch ? 'Waiting for confirmation...'
                                    : switchState && canBatch ? "Batch borrow"
                                        : approvals[nextText] ?  "Borrow part "+(nextText+1)+" of "+ batch_txt 
                                                : "Approve part "+(nextText+1)+" of "+batch_txt 
                            }
                        </Button>  
                    </Row>
                </Accordion.Body>
            </Accordion.Item>
        </div>
    );
    /*Liquidity data card list generator*/
    const PositionItems = borrow_positions.map((position: any) =>
        <div key={position}>
            <ListGroup.Item style={{border: 'none'}}>
                <Row>
                    <Col xs={4} className="d-flex align-items-center"  style={{ minWidth: "0" }}>
                        <Balancer>
                            {pool[0].symbol} / {pool[1].symbol} <Form.Text muted> {(Number(multiplier) * position[0])/10000}% </Form.Text>
                        </Balancer>
                    </Col>
                    <Col xs={2} className="d-flex align-items-center"  style={{ minWidth: "0" }}>
                        <Balancer>
                        {
                            (convert_price(position[1], token0.address == pool[0].address)).toLocaleString(undefined,{minimumFractionDigits: (rounding(convert_price(position[1], token0.address == pool[0].address), token0.decimals))})
                        }
                        </Balancer>
                    </Col>
                    <Col>
                        <Row>
                            <Col className="d-flex align-items-center"  style={{ minWidth: "0" }}>
                                <Balancer>
                                    {(Number(position[3][0]) / 10**pool[0].decimals).toLocaleString(undefined,{minimumFractionDigits: (rounding(Number(position[3][0]) / 10**pool[0].decimals, pool[0].decimals))})}
                                </Balancer>
                            </Col>
                            <Col className="d-flex align-items-center"  style={{ minWidth: "0" }}>
                                <Balancer>
                                    <Form.Text muted>{pool[0].symbol}</Form.Text>
                                </Balancer>
                            </Col>
                            <Col xs={1}>
                                <a onClick={() => handlePosition(position)}><FaEdit/></a>
                            </Col>
                        </Row> 
                    </Col>
                </Row>
                <Row>
                    <Col xs={4}></Col>
                    <Col xs={2}></Col>
                    <Col>
                        <Row>
                            <Col className="d-flex align-items-center"  style={{ minWidth: "0" }}>
                                <Balancer>
                                    {(Number(position[3][1]) / 10**pool[1].decimals).toLocaleString(undefined,{minimumFractionDigits: (rounding(Number(position[3][1]) / 10**pool[1].decimals, pool[1].decimals))})} 
                                </Balancer>
                            </Col>
                            <Col className="d-flex align-items-center"  style={{ minWidth: "0" }}>
                                <Balancer>
                                    <Form.Text muted>{pool[1].symbol}</Form.Text>
                                </Balancer>
                            </Col>
                            <Col xs={1}/>
                        </Row> 
                    </Col>
                </Row>
            </ListGroup.Item>
        </div>
    );

    return(
        <Container>
            <Row className="head">

                <Alert variant="success" className="button-main">
                    Sepolia testnet only
                </Alert>

                {/*Input card*/}
                <Card className="card">
                    <Card.Body>
                        <Card.Title className="mb-4">Borrow
                        </Card.Title> 
                        <InputGroup className="mb-3">
                            <Form.Control type="number" size="lg" placeholder="0" value={amountToken[0]} onChange={amountInput} className="form-control-plaintext"/>
                            <Button onClick={handlePoolShow} variant="white" size="sm">
                                <img 
                                    src={token0.logoURI} 
                                    width={20} 
                                    height={20}
                                    onError={(e) => {
                                        const img = e.currentTarget;
                                        img.onerror = null; 
                                        img.src = generateTokenLogo(token0.symbol);
                                    }}
                                    style={{ borderRadius: 60 }}/> {token0.symbol}
                            </Button>
                        </InputGroup>
                    </Card.Body>
                </Card>
            </Row> 
            {/*Button send txt*/}
            <Row className="row-button">
                <Connection />
            </Row>
            <Row className="row-button">
                <Form.Check
                    id="custom-switch"

                    disabled={!supports7702()} 
                    reverse
                    type="switch"
                    label="smart account"
                    defaultChecked={switchState}
                    onClick={() => setSwitchState(!switchState)}
                />  
            </Row>
            {/*Liqudity data cards*/}
            <Row className="bottom">
                <Card className="card">
                    <Card.Body>
                        <Row>
                            <Card.Title>Positions 
                                <ButtonGroup size="sm" className="card-button-right">
                                    <Button variant="secondary" className="card-button-right" onClick={() => setOffset(offset - (2*price_loop))}>
                                        {token0.address == pool[0].address ? "-" : " +"}     
                                    </Button>
                                    <Button variant="secondary" disabled>
                                        {
                                            (convert_price(minmax[0], token0.address == pool[0].address)).toLocaleString(undefined,{minimumFractionDigits: (rounding(convert_price(minmax[0], token0.address == pool[0].address), token0.decimals))})
                                        } - {             
                                            (convert_price(minmax[1], token0.address == pool[0].address)).toLocaleString(undefined,{minimumFractionDigits: (rounding(convert_price(minmax[1], token0.address == pool[0].address), token0.decimals))})
                                        }
                                        </Button>
                                    <Button variant="secondary" className="card-button-right" onClick={() => setOffset(offset + (2*price_loop))}>
                                        {token0.address == pool[0].address ? "+" : " -"}
                                    </Button>
                                </ButtonGroup>
                            </Card.Title>
                        </Row>
                        <ListGroup variant="flush">
                            <ListGroup.Item disabled> 
                                <Row>
                                    <Col xs={4} className="d-flex align-items-center"  style={{ minWidth: "0" }}>
                                        <Balancer>
                                            Pool
                                        </Balancer>
                                    </Col>
                                    <Col xs={2} className="d-flex align-items-center"  style={{ minWidth: "0" }}>
                                        <Balancer>
                                            Price
                                        </Balancer>
                                    </Col>
                                    <Col className="d-flex align-items-center"  style={{ minWidth: "0" }}>
                                        <Balancer>
                                            Borrow value
                                        </Balancer>
                                    </Col>
                                </Row>
                            </ListGroup.Item>
                            {PositionItems}
                        </ListGroup>
                    </Card.Body>
                </Card>
            </Row>
           {/*Pool modal*/}    
            <Modal show={poolShow} onHide={handlePoolClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <Row>
                            <Col>
                                Pool
                            </Col> 
                        </Row>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className="mb-4">
                        <ListGroup variant="flush">
                            {PoolItems}
                        </ListGroup>
                    </Row>
                </Modal.Body>
            </Modal>
            {/*Token select modal*/}    
            <Modal show={tokenShow} onHide={handleTokenClose} centered scrollable>
                <Modal.Header closeButton>   
                    <Modal.Title>
                        Select token
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ListGroup variant="flush">
                        {TokenItems}
                    </ListGroup>
                </Modal.Body>
            </Modal>
            {/*Borrow modal*/}    
            <Modal show={borrowShow} onHide={handleBorrowClose} centered scrollable>
                <Modal.Header closeButton>   
                    <Modal.Title>
                        Borrow  <Form.Text muted>{amountToken[0]} {token0.symbol}</Form.Text>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Accordion defaultActiveKey="Lowest interest">
                        {BorrowItems}
                    </Accordion>
                </Modal.Body>
            </Modal>
            {/*Position modal*/}   
            <Modal show={positionShow} onHide={handlePositionClose} centered>
                <Modal.Header closeButton>   
                    <Modal.Title>
                         <Modal.Title> {pool[0].symbol} / {pool[1].symbol} <Form.Text muted>{(Number(multiplier) * activePosition[0])/10000}%</Form.Text></Modal.Title>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ListGroup>
                        <ListGroup.Item variant="secondary">
                            <Row className="mb-2">
                                <Col>
                                    Borrow value
                                </Col>
                                <Col>
                                    {activePosition[3] 
                                    ? (Number(activePosition[3][0]) / 10**pool[0].decimals).toLocaleString(undefined,{minimumFractionDigits: (rounding(Number(activePosition[3][0]) / 10**pool[0].decimals, pool[0].decimals))})
                                    : ""
                                    }
                                </Col>
                                <Col xs={3}>
                                    <Form.Text muted>{pool[0].symbol}</Form.Text>
                                </Col>
                            </Row>
                            <Row className="mb-2">
                                <Col>
                                </Col>
                                <Col>
                                    {activePosition[3] 
                                    ?(Number(activePosition[3][1]) / 10**pool[1].decimals).toLocaleString(undefined,{minimumFractionDigits: (rounding(Number(activePosition[3][1]) / 10**pool[1].decimals, pool[1].decimals))})
                                    : ""
                                    }
                                </Col>
                                <Col xs={3}>
                                    <Form.Text muted>{pool[1].symbol}</Form.Text>
                                </Col>
                            </Row>
                        </ListGroup.Item>
                        <ListGroup.Item variant="secondary">
                            <Row className="mb-3">
                                <Col>
                                    Collateral
                                </Col>
                                <Col>
                                    {activePosition[2]
                                    ? (Number(activePosition[2][1]) / (activePosition[4] ? 10**pool[1].decimals: 10**pool[0].decimals)).toLocaleString(undefined,{minimumFractionDigits: (rounding(Number(activePosition[2][1]) / (activePosition[4] ? 10**pool[1].decimals: 10**pool[0].decimals), (activePosition[4] ? pool[1].decimals: pool[0].decimals)))})
                                    : ""
                                    }
                                </Col>
                                <Col xs={3}>
                                    <Form.Text muted>{
                                        activePosition[4]
                                        ? pool[0].symbol
                                        : pool[1].symbol
                                    }</Form.Text>
                                </Col>
                            </Row>
                        </ListGroup.Item>
                        <ListGroup.Item variant="secondary">
                            <Row style={{textAlign: "center"}}>
                                {activePosition[2] ?
                                <Alert  variant="custom">
                                <Row>
                                    <Form.Text >{new Date((Number(activePosition[2][3]) + Number(activePosition[5])) * 1000).toLocaleString()}</Form.Text>
                                    <Form.Text ><Countdown date={new Date((Number(activePosition[2][3]) + Number(activePosition[5])) * 1000)}/></Form.Text>
                                </Row> 
                                </Alert>
                                : ""}
                            </Row>
                            <Row>
                                <Col>
                                    Interest
                                </Col>
                                <Col>
                                <InputGroup className="mb-3">
                                    <Form.Control type="number" size="sm" placeholder="0" 
                                        value={amountInterest[0]}
                                        onChange={interestAdjustInput}
                                        className="form-control-plaintext"
                                    />
                                </InputGroup>
                                </Col>
                                <Col xs={3}>
                                    <Form.Text muted>{
                                        activePosition[4]
                                                ? pool[0].symbol
                                                : pool[1].symbol
                                    }</Form.Text>
                                </Col>
                            </Row>
                        </ListGroup.Item>
                    </ListGroup>
                </Modal.Body>
                <Modal.Footer>
                    {
                    sliderValue != 0 ?
                    <Modal.Body>
                        <ListGroup>
                            <ListGroup.Item variant="secondary">
                                <Row className="mb-2">
                                    <Col>
                                        Repay
                                    </Col>
                                    <Col>
                                    {activePosition[3] 
                                        ? (sliderValue * Number(activePosition[3][0]) / 10**pool[0].decimals / 100).toLocaleString(undefined,{minimumFractionDigits: (rounding(sliderValue * Number(activePosition[3][0]) / 10**pool[0].decimals / 100, pool[0].decimals))})
                                        : ""
                                    }
                                    </Col>
                                    <Col xs={3}><Form.Text muted>{pool[0].symbol}</Form.Text></Col>
                                </Row>
                                <Row>
                                    <Col></Col>
                                    <Col>
                                   {activePosition[3] 
                                        ? (sliderValue * Number(activePosition[3][1]) / 10**pool[1].decimals / 100).toLocaleString(undefined,{minimumFractionDigits: (rounding(sliderValue * Number(activePosition[3][1]) / 10**pool[1].decimals / 100, pool[1].decimals))})
                                        : ""
                                    }
                                    </Col>
                                    <Col xs={3}><Form.Text muted>{pool[1].symbol}</Form.Text></Col>
                                </Row>
                            </ListGroup.Item>
                            <ListGroup.Item variant="secondary">
                                <Row className="mb-2">
                                    <Col>
                                        Receive
                                    </Col>
                                    <Col>
                                    {activePosition[2]
                                        ?(sliderValue * (Number(activePosition[2][1]) / (activePosition[4] ? 10**pool[1].decimals: 10**pool[0].decimals)) / 100).toLocaleString(undefined,{minimumFractionDigits: (rounding(sliderValue * (Number(activePosition[2][1]) / (activePosition[4] ? 10**pool[1].decimals: 10**pool[0].decimals)) / 100, (activePosition[4] ? pool[1].decimals: pool[0].decimals)))})
                                        : ""
                                    }
                                    </Col>
                                    <Col xs={3}>
                                        <Form.Text muted>{
                                            activePosition[4]
                                                    ? pool[0].symbol
                                                    : pool[1].symbol
                                        }</Form.Text>
                                    </Col>
                                </Row>
                            </ListGroup.Item>
                        </ListGroup>
                    </Modal.Body>
                    : ""
                    }
                    <Row className="row-button">
                        <Col xs={2}>0%</Col>
                        <Col>
                            <Form.Range
                                value={sliderValue}
                                onChange={handleSliderChange}
                            />
                        </Col>
                        <Col xs={2}>100%</Col>
                    </Row>
                    <Row className="row-button">
                        <Button variant="custom" className="button-token-center" disabled={isWriting || isConfirming} onClick={handleCloseBorrow}>
                            {isWriting ? 'Confirming in wallet...' 
                                : isConfirming ? 'Waiting for confirmation...'
                                    : !approvalClose[0] || !approvalClose[1] ? "Approve" 
                                        : sliderValue != 100 ? "Adjust"
                                            : "Close"
                            }
                        </Button>
                    </Row>
                </Modal.Footer>
            </Modal>
        </Container>
    )
}

export default Borrow
import "./main.css"
import { useEffect, useState } from 'react'

import Balancer from 'react-wrap-balancer'

//Bootstrap 
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import Dropdown from 'react-bootstrap/Dropdown'
import Container from 'react-bootstrap/Container'
import ListGroup from 'react-bootstrap/ListGroup'
import InputGroup from 'react-bootstrap/InputGroup'
import ButtonGroup from 'react-bootstrap/ButtonGroup'

import Alert from 'react-bootstrap/Alert';

import { FaEdit } from "react-icons/fa"
import { IoSwapHorizontalSharp } from "react-icons/io5"

//Web3
import { parseUnits, Address, encodeFunctionData } from 'viem'
import { useConnect, useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSimulateContract,  useSendCalls, useCallsStatus} from 'wagmi'

import { ERC20_abi } from "../assets/IERC20"
import { UniV3_Pool_abi } from "../assets/IUniswapV3Pool"
import { Kommodo_Pool_abi } from "../assets/IKommodoPool"
import { UniV3_Factory_abi } from "../assets/IUniswapV3Factory"
import { Kommodo_Factory_abi } from "../assets/IKommodoFactory"
import { NonfungibleLendManager_abi } from "../assets/INonfungibleLendManager"

import { Tokens } from "../assets/Tokens" 
import { Factory_Locations } from '../assets/Locations'

const Provide = () => {

    const eip702chains = [1, 11155111]
    /*Web3 connector values*/
    const chainId = useChainId()
    const account = useAccount()

    /*Kommodo values*/
    const [token0, setToken0] = useState(
        {
            "chainId": 0,
            "type": "",
            "address": "0x0000000000000000000000000000000000000000",
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
            "address": "0x0000000000000000000000000000000000000000",
            "name": "",
            "symbol": "",
            "decimals": 0,
            "logoURI": ""
        }
    ) 
    const [pool , setPool] = useState([{
            "chainId": 0,
            "type": "",
            "address": "0x0000000000000000000000000000000000000000",
            "name": "",
            "symbol": "",
            "decimals": 0,
            "logoURI": ""
        },
        {
            "chainId": 0,
            "type": "",
            "address": "0x0000000000000000000000000000000000000000" ,
            "name": "",
            "symbol": "",
            "decimals": 0,
            "logoURI": ""
        }
    ])
    const [fee, setFee] = useState(500)
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

    const max_size = 7
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
        const Q32 = 2n ** 32n                                                                
        let absTick = BigInt(tick < 0 ? -tick : tick)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
        let ratio = (absTick & 1n) != 0n ? 0xfffcb933bd6fad37aa2d162d1a594001n : 0x100000000000000000000000000000000n                                                                                                                                                      
        if ((absTick & 0x2n) != 0n) ratio = (ratio * 0xfff97272373d413259a46990580e213an) >> 128n                                                                                                                                                                        
        if ((absTick & 0x4n) != 0n) ratio = (ratio * 0xfff2e50f5f656932ef12357cf3c7fdccn) >> 128n                                                                                                                                                                          
        if ((absTick & 0x8n) != 0n) ratio = (ratio * 0xffe5caca7e10e4e61c3624eaa0941cd0n) >> 128n                                                                                                                                                                          
        if ((absTick & 0x10n) != 0n) ratio = (ratio * 0xffcb9843d60f6159c9db58835c926644n) >> 128n                                                                                                                                                                         
        if ((absTick & 0x20n) != 0n) ratio = (ratio * 0xff973b41fa98c081472e6896dfb254c0n) >> 128n                                                                                                                                                                         
        if ((absTick & 0x40n) != 0n) ratio = (ratio * 0xff2ea16466c96a3843ec78b326b52861n) >> 128n                                                                                                                                                                         
        if ((absTick & 0x80n) != 0n) ratio = (ratio * 0xfe5dee046a99a2a811c461f1969c3053n) >> 128n                                                                                                                                                                         
        if ((absTick & 0x100n) != 0n) ratio = (ratio * 0xfcbe86c7900a88aedcffc83b479aa3a4n) >> 128n                                                                                                                                                                        
        if ((absTick & 0x200n) != 0n) ratio = (ratio * 0xf987a7253ac413176f2b074cf7815e54n) >> 128n                                                                                                                                                                        
        if ((absTick & 0x400n) != 0n) ratio = (ratio * 0xf3392b0822b70005940c7a398e4b70f3n) >> 128n                                                                                                                                                                        
        if ((absTick & 0x800n) != 0n) ratio = (ratio * 0xe7159475a2c29b7443b29c7fa6e889d9n) >> 128n                                                                                                                                                                        
        if ((absTick & 0x1000n) != 0n) ratio = (ratio * 0xd097f3bdfd2022b8845ad8f792aa5825n) >> 128n                                                                                                                                                                       
        if ((absTick & 0x2000n) != 0n) ratio = (ratio * 0xa9f746462d870fdf8a65dc1f90e061e5n) >> 128n                                                                                                                                                                       
        if ((absTick & 0x4000n) != 0n) ratio = (ratio * 0x70d869a156d2a1b890bb3df62baf32f7n) >> 128n                                                                                                                                                                       
        if ((absTick & 0x8000n) != 0n) ratio = (ratio * 0x31be135f97d08fd981231505542fcfa6n) >> 128n                                                                                                                                                                       
        if ((absTick & 0x10000n) != 0n) ratio = (ratio * 0x9aa508b5b7a84e1c677de54f3e99bc9n) >> 128n                                                                                                                                                                       
        if ((absTick & 0x20000n) != 0n) ratio = (ratio * 0x5d6af8dedb81196699c329225ee604n) >> 128n                                                                                                                                                                        
        if ((absTick & 0x40000n) != 0n) ratio = (ratio * 0x2216e584f5fa1ea926041bedfe98n) >> 128n                                                                                                                                                                          
        if ((absTick & 0x80000n) != 0n) ratio = (ratio * 0x48a170391f7dc42444e8fa2n) >> 128n                                                                                                                                                                                                                                                                                                                                                                                                                                              
        if (tick > 0) ratio = (2n ** 256n - 1n) / ratio                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
        // Convert from Q128.128 to Q64.96                                                                                                                                                                                                                                 
        return (ratio >> 32n) + (ratio % Q32 > 0n ? 1n : 0n)
    }
    function price_to_sqrt(price: number){
        try{
            return(BigInt(Math.floor(Math.sqrt(price) * (2**96))))
        } catch {
            return(0n)
        }   
    }
    function sqrt_to_tick(sqrt: bigint){
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

    function get_prices(exp: number, index: number){
        let price_current = get_exp_index_price(exp, index)
        let exp_below = index == 0 ? [get_exp_index_price(exp-1, 3), exp-1, 3] : [get_exp_index_price(exp, index-1), exp, index-1]
        let exp_above = index == 3 ? [get_exp_index_price(exp+1, 0), exp+1, 0] : [get_exp_index_price(exp, index+1), exp, index+1]
        return([exp_below,[price_current, exp, index],exp_above])
    }

    function liquidity_to_token_amount(liquidity: bigint, sqrt: bigint, tick: bigint){
        //Current SQRTprice and position SQRTprices
        let position_sqrt_lower = BigInt(0)
        let position_sqrt_higher = BigInt(0)
        let amount0 = BigInt(0)
        let amount1 = BigInt(0)
        if(tickSpacing){
            position_sqrt_lower = tick_to_sqrt(Number(tick))
            position_sqrt_higher = tick_to_sqrt(Number(tick) + tickSpacing)
        }
        //Calculate amounts based on price
        if(sqrt != 0n && position_sqrt_lower != 0n && position_sqrt_higher != 0n){
            if(sqrt <= position_sqrt_lower){
                amount0 = (BigInt(liquidity) * BigInt(2**96) * (position_sqrt_higher - position_sqrt_lower) + (position_sqrt_higher * position_sqrt_lower) - 1n) / (position_sqrt_higher * position_sqrt_lower)   
            } else if(sqrt < position_sqrt_higher) {
                amount0 = (BigInt(liquidity) * BigInt(2**96) * (position_sqrt_higher - sqrt) + (position_sqrt_higher * sqrt) - 1n) / (position_sqrt_higher * sqrt) 
                amount1 = (liquidity * (sqrt - position_sqrt_lower) + BigInt(2**96) - 1n) / BigInt(2**96)   
                amount1 = liquidity * (sqrt - position_sqrt_lower) / BigInt(2**96)
            } else {
                amount1 = (liquidity * (position_sqrt_higher - position_sqrt_lower) + BigInt(2**96) - 1n) / BigInt(2**96) 
            }
        }
        return([amount0, amount1])
    }

    function amounts_to_liquidity(amountA: bigint, amountB: bigint, sqrt: bigint, tick: bigint){
        //rounds liquidity down - slippage protection
        let amount0 = BigInt(amountA)  
        let amount1 = BigInt(amountB)  
        //Current SQRTprice and position SQRTprices
        const Q96 = 2n ** 96n;
        let position_sqrt_lower = BigInt(0)
        let position_sqrt_higher = BigInt(0)
        let liquidity = BigInt(0)
        if(tickSpacing){
            position_sqrt_lower = tick_to_sqrt(Number(tick))
            position_sqrt_higher = tick_to_sqrt(Number(tick) + tickSpacing)
        }
        //Calculate amounts based on price
        if(sqrt != 0n && position_sqrt_lower != 0n && position_sqrt_higher != 0n){
            if(sqrt <= position_sqrt_lower){
                //amount0 * (sqrt(upper) * sqrt(lower)) / (sqrt(upper) - sqrt(lower))
                liquidity = BigInt(amount0) * (position_sqrt_higher * position_sqrt_lower) / ((position_sqrt_higher - position_sqrt_lower) * Q96)  
            } else if(sqrt < position_sqrt_higher) {
                let liquidity0 = BigInt(amount0) * (position_sqrt_higher * sqrt) / ((position_sqrt_higher - sqrt) * Q96)
                let liquidity1 = (BigInt(amount1) * Q96) / (sqrt - position_sqrt_lower)
                liquidity = liquidity0 < liquidity1 ? liquidity0 : liquidity1
            } else {
                //amount1 / (sqrt(upper) - sqrt(lower)).
                liquidity = (BigInt(amount1) * Q96) / (position_sqrt_higher - position_sqrt_lower)
            }
        }
        return(liquidity)
    }

    function feeGrowth_to__amount(global_fee: bigint, position_fee: bigint, liquidity: bigint){
        return(((global_fee - position_fee) * liquidity / BigInt(2**128)))
    }


/* DESIGN */    
    /*Input button*/
    const { connectors, connect } = useConnect()
    const [needsApproval, setNeedsApproval] = useState<any>()
    function Connection(){     
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
        const provide_button = (
            <Button className="button-main"
                variant="custom"
                disabled={isWriting || isConfirmingBatch || isConfirming || (!needsApproval && !(Number(amountToken[0]) > 0)) || !sufficient_balance}
                onClick={handleProvide}
            >
                {isWriting ? 'Confirming in wallet...' : isConfirming || isConfirmingBatch ? 'Waiting for confirmation...' : buttonText}
            </Button>
        )
        if(account.status === 'disconnected')  {
            return connector_button[0]
        } else  {
            return provide_button  
        }
    }

    /*Pool selector modal*/
    const [poolShow, setPoolShow] = useState(false)
    const handlePoolClose = () => setPoolShow(false)
    const handlePoolShow = () => setPoolShow(true)

    /*Token selector modal*/
    const [tokenShow, setTokenShow] = useState(false)
    const handleTokenClose = () => setTokenShow(false)
    const handleTokenShow = () => setTokenShow(true)

    /*Position edit modal*/
    const [positionShow, setPositionShow] = useState(false)
    const handlePositionClose = () => setPositionShow(false)
    const handlePositionShow = () => setPositionShow(true)
    const [activePosition, setActivePosition] = useState<any>([])

    /*Position withdraw modal*/
    const [withdrawShow, setWithdrawShow] = useState(false)
    const handleWithdrawClose = () => setWithdrawShow(false)
    const handleWithdrawShow = () => setWithdrawShow(true)

    /*Position deposit modal*/
    const [depositShow, setDepositShow] = useState(false)
    const handleDepositClose = () => setDepositShow(false)
    const handleDepositShow = () => setDepositShow(true)
    const [amountDepositA, setAmountDepositA] = useState(['',0n]) 
    const [amountDepositB, setAmountDepositB] = useState(['',0n]) 

    function depositAInput(e: any){
        if(e.target.value >= 0){
            setAmountDepositA([e.target.value, BigInt(parseUnits(e.target.value, pool[0].decimals))])
        } 
    }

    function depositBInput(e: any){
        if(e.target.value >= 0){
            setAmountDepositB([e.target.value, BigInt(parseUnits(e.target.value, pool[1].decimals))])
        } 
    }

    function handlePosition(position: any){
        setActivePosition(position)
        handlePositionShow()
    }

    /*Card amount and price input*/
    const [switchState, setSwitchState] = useState(supports7702());
    const [selectedPrices, setSelectedPrices] = useState([[0,0,0],[0,0,0],[0,0,0]])
    const [amountToken, setAmountToken] = useState(['',0n]) 

    function amountInput(e: any){
        if(e.target.value >= 0){
            setAmountToken([e.target.value, BigInt(parseUnits(e.target.value, token0.decimals))])
        } 
    }

    function amountMax(){
        if(token0.address == pool[0].address ){
            setAmountToken([(Number(balance0) / 10**pool[0].decimals).toFixed(pool[0].decimals), balance0 ? balance0 : 0n])
        } else if (token0.address == pool[1].address){
            setAmountToken([(Number(balance1) / 10**pool[1].decimals).toFixed(pool[1].decimals), balance1 ? balance1 : 0n])
        }
    }

    function pricesInput(price: any){  
        if(!Number.isNaN(price)){
            let exp_index = price_close_log_index(price)
            let prices = get_prices(Number(exp_index[0]), Number(exp_index[1]))
            setSelectedPrices(prices)
        }
    }
    function exponentInput(exp: any, index: any){
        if(!Number.isNaN(exp)){
            let prices = get_prices(Number(exp), Number(index))
            setSelectedPrices(prices)
        }
    }

    /*Withraw amount input */
    const [withdraw0, setWithdraw0] = useState(["", 0])
    const [withdraw1, setWithdraw1] = useState(["", 0])
    const [withdrawLiquidity, setWithdrawLiquidity] = useState(BigInt(0))
    function amountWithdraw0(e: any){
        setWithdraw0([e.target.value, parseUnits(e.target.value, pool[0].decimals)])
    }
    function amountWithdraw1(e: any){
        setWithdraw1([e.target.value, parseUnits(e.target.value, pool[1].decimals)])
    }
    function amountWithdraw(amountA: any, amountB: any){
        setWithdraw0([(Number(amountA) / 10**pool[0].decimals).toFixed(pool[0].decimals), amountA])
        setWithdraw1([(Number(amountB) / 10**pool[1].decimals).toFixed(pool[1].decimals), amountB])
    }
    const [sliderValue, setSliderValue] = useState(0);
    const handleSliderChange = (e: any) => {
        setSliderValue(Number(e.target.value));
        const _position = activePosition[0] != undefined ? activePosition[0][3] : 0
        const tick = activePosition[0] != undefined ? activePosition[0][1] : 0
        setWithdrawLiquidity(BigInt(_position) * BigInt(e.target.value) / 100n)
        const newPosition = liquidity_to_token_amount(BigInt(_position) * BigInt(e.target.value) / 100n, slot0[0], BigInt(tick))
        const newA = Number(newPosition[0]) 
        const newB = Number(newPosition[1])
        amountWithdraw(newA, newB)
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
                used.push(Tokens[key].address)
                chainId_Tokens.push(Tokens[key])
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
        let slot0_price = sqrt_to_price(Number(slot0[0]))        
        let exp_index = price_close_log_index(slot0_price)
        let prices = get_prices(Number(exp_index[0]), Number(exp_index[1]))
        let input_price
        if(slot0_price < 1){
            input_price = prices[0] && prices[1] && temp1.address == pool[0].address ? prices[2][0] : prices[1][0]
        } else {
            input_price = prices[0] && prices[1] && temp1.address == pool[0].address ? prices[1][0] : prices[0][0]
        }
        pricesInput(input_price)
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
    let kommodoFactoryAddress 
    let nonfungibleLendManagerAddress    
    try{
        uniswapFactoryAddress = chainId_Factories_list.UniswapV3Factory.ContractAddress
        kommodoFactoryAddress = chainId_Factories_list.KommodoFactory.ContractAddress
        nonfungibleLendManagerAddress = chainId_Factories_list.NonfungibleLendManager.ContractAddress
    } catch { console.log("no available uni and/or kommodo factory or nft") }
    const { data: uniPoolAddress, refetch: refetch_uniPoolAddress } = useReadContract({
        abi: UniV3_Factory_abi,
        address: uniswapFactoryAddress,
        functionName: 'getPool',
        args: [token0.address as Address, token1.address as Address, fee]
    })
    const { data: kommodoPoolAddress, refetch: refetch_kommodoPoolAddress } = useReadContract({
        abi: Kommodo_Factory_abi,
        address: kommodoFactoryAddress,
        functionName: 'kommodo',
        args: [token0.address as Address, token1.address as Address, fee]
    })
    const { data: _slot0, refetch: refetch_slot0 } = useReadContract({
        abi: UniV3_Pool_abi,
        address: uniPoolAddress as Address,
        functionName: 'slot0',
    })
    const { data: tickSpacing } = useReadContract({
        abi: Kommodo_Pool_abi,
        address: kommodoPoolAddress as Address,
        functionName: 'tickSpacing',
    })
    const { data: multiplier } = useReadContract({
        abi: Kommodo_Factory_abi,
        address: kommodoFactoryAddress,
        functionName: 'multiplier',
    })
    let { data: allowance, refetch: refetch_allowance } = useReadContract({
        abi: ERC20_abi,
        address: token0.address as Address,
        functionName: 'allowance',
        args: [account.address as Address, nonfungibleLendManagerAddress as Address]
    })
    let { data: balance0, refetch: refetch_balance0} = useReadContract({
        abi: ERC20_abi,
        address: pool[0].address as Address,
        functionName: 'balanceOf',
        args: [account.address as Address],
    })
    let { data: balance1, refetch: refetch_balance1 } = useReadContract({
        abi: ERC20_abi,
        address: pool[1].address as Address,
        functionName: 'balanceOf',
        args: [account.address as Address]
    })
    //NFT data retrieve
    const [reloadPage, setReloadPage] = useState(false)
    
    const { data: NFTbalance, refetch: refetch_NFTbalance} = useReadContract({
        abi: NonfungibleLendManager_abi,
        address: nonfungibleLendManagerAddress as Address,
        functionName: 'balanceOf',
        args: [account.address as Address]
    })
    let nft_balance = NFTbalance ? NFTbalance : 0
    let nft_loop = 5
    let nft_positions: any = []
    const [start, setStart] = useState(0)
    for (let x = start; x < (nft_loop + start); x++) {
        const { data: NFTid } = useReadContract({
            abi: NonfungibleLendManager_abi,
            address: nonfungibleLendManagerAddress as Address,
            functionName: 'tokenOfOwnerByIndex',
            args: [account.address as Address, BigInt(x)],
            query: {
                enabled: nft_balance != 0 && nft_balance > x,
            }
        })
        let id = NFTid ? NFTid : 0n
        const { data: NFTposition} = useReadContract({
            abi: NonfungibleLendManager_abi,
            address: nonfungibleLendManagerAddress as Address,
            functionName: 'position',
            args: [id],
            query: {
                enabled: nft_balance != 0 && nft_balance > x,
            }
        })
        let nft_tick = NFTposition ? NFTposition[1] : 0
        const { data: NFTassets} = useReadContract({
            abi: Kommodo_Pool_abi,
            address: kommodoPoolAddress as Address,
            functionName: 'assets',
            args: [nft_tick]
        })
        const { data: total_assets } = useReadContract({
            abi: Kommodo_Pool_abi,
            address: kommodoPoolAddress as Address,
            functionName: 'assets',
            args: [Number(nft_tick)]
        })
        if(_slot0 && NFTposition && NFTassets && nft_balance != 0 && nft_balance > x){
            let fee0 = feeGrowth_to__amount(NFTassets[2], NFTposition[5], NFTposition[3])
            let fee1 = feeGrowth_to__amount(NFTassets[3], NFTposition[6], NFTposition[3])
            let total_fee = [Number(NFTposition[7]) + Number(fee0), Number(NFTposition[8]) + Number(fee1)]
            let amounts = liquidity_to_token_amount(NFTposition[3], slot0[0], BigInt(NFTposition[1]))
            let position_price = sqrt_to_price(Number(tick_to_sqrt(NFTposition[1])))
            let new_position_price = NFTposition[1] < 0 ? 1 / position_price : position_price
            let exp_index = price_close_log_index(new_position_price)
            let new_exp_index = NFTposition[1] < 0 ? convert_exp(Number(exp_index[0]), Number(exp_index[1])) : exp_index
            let price_close = get_exp_index_price(Number(new_exp_index[0]), Number(new_exp_index[1]))
            let price_close_adjusted = token0.address == pool[0].address ? price_close : 1 / price_close
            if(kommodoPoolAddress == NFTposition[0]){
                nft_positions.push([NFTposition, amounts, total_fee, total_assets, id, price_close_adjusted])
            }
        }
    }    
    if(_slot0 && _slot0 != slot0){
        setSlot0(_slot0)
        let slot0_price = sqrt_to_price(Number(_slot0[0]))
        let exp_index = price_close_log_index(slot0_price)
        let prices = get_prices(Number(exp_index[0]), Number(exp_index[1]))
        let input_price
        if(slot0_price < 1){
            input_price = prices[0] && prices[1] && token0.address == pool[0].address ? prices[2][0] : prices[1][0]
        } else {
            input_price = prices[0] && prices[1] && token0.address == pool[0].address ? prices[1][0] : prices[0][0]
        }
        pricesInput(input_price)
    }

    /* Web3 write functions */
    function supports7702(): boolean {
        if(eip702chains.includes(chainId)){
            return true
        } else {
            return false
        }
    }

    /* Approval and mint */  
    const max_allowance = "115792089237316195423570985008687907853269984665640564039457584007913129639935"
    const buttonText = needsApproval && !switchState ? 'Approve' : 'Provide'
    useEffect(() => {
        if (allowance !== undefined) {
            setNeedsApproval(allowance < BigInt(amountToken[1] || allowance == BigInt(0)))
        }
    }, [allowance])

    const { sendCalls, data } = useSendCalls()
    const { writeContract, data: hash, isPending: isWriting } = useWriteContract() 
    const { isLoading: _isConfirming, isSuccess: _isConfirmed } = useWaitForTransactionReceipt( {hash} ) 
    
    const {data: callsStatus, isLoading: isConfirming } = useCallsStatus({
        id: data?.id!,
        query: {
            enabled: !!data?.id,
            refetchInterval: (query) =>
                query.state.data?.status === 'pending' ? 1000 : false,
        }, 
    })  
    let isConfirmingBatch = callsStatus?.status === 'pending' 

    useEffect(() => {
        if (_isConfirmed || callsStatus?.status == 'success') {
            refetch_slot0()
            refetch_balance0()
            refetch_balance1()
            refetch_allowance()
            refetch_NFTbalance()
            refetch_uniPoolAddress()
            refetch_kommodoPoolAddress()
            if(reloadPage){
                window.location.reload()
            }
        }
    }, [_isConfirmed,
        callsStatus,
        refetch_slot0,
        refetch_balance0,
        refetch_balance1,
        refetch_allowance,
        refetch_NFTbalance,
        refetch_uniPoolAddress,
        refetch_kommodoPoolAddress,
        reloadPage
    ])

    const { data: approveConfig } = useSimulateContract({
        abi: ERC20_abi,
        address: token0.address as Address,
        functionName: 'approve',
        args: [nonfungibleLendManagerAddress as Address, parseUnits(max_allowance, 0)],
        query: {
            enabled: needsApproval, // Enabled only if approval is needed
        },
    })

    let sufficient_balance = false
    if(token0.address == pool[0].address){
        sufficient_balance = balance0 ? balance0 >= BigInt(amountToken[1]) : false
    } else {
        sufficient_balance = balance1 ? balance1 > BigInt(amountToken[1]) : false
    }

    let amount0max = amountToken[1] && token0.address == pool[0].address ? BigInt(amountToken[1]) : BigInt(0)
    let amount1max = amountToken[1] && token0.address == pool[0].address ? BigInt(0) : BigInt(amountToken[1]) 
    let input_tick = sqrt_to_tick(price_to_sqrt(selectedPrices[1][0]))
    let liquidity_input = amounts_to_liquidity(amount0max, amount1max, slot0[0], input_tick) 

    const mintParams: any = []
    mintParams.push(pool[0].address) // mintParams[0] - assetA
    mintParams.push(pool[1].address) // mintParams[1] - assetB
    mintParams.push(fee) // mintParams[2] - poolFee
    mintParams.push(input_tick) // mintParams[3] - tickLower
    mintParams.push(liquidity_input) // mintParams[4] - liquidity
    mintParams.push(amount0max) //provideParams[5] - amountAmax
    mintParams.push(amount1max) //provideParams[6] - amountBmax

    const { data: provideConfig } = useSimulateContract({
        abi: NonfungibleLendManager_abi,
        address: nonfungibleLendManagerAddress,
        functionName: 'mint',
        args: [mintParams],
        query: {
            enabled: (!needsApproval && Number(amountToken[1]) > 0 && sufficient_balance), // Enabled only if approval is not needed
        },  
    })
    
    const approveCall = needsApproval && approveConfig?.request ? {
            to: approveConfig.request.address,
            data: encodeFunctionData({
            abi: approveConfig.request.abi,
            functionName: approveConfig.request.functionName,
            args: approveConfig.request.args,
            }),
        }
    : null

    const mintCall = {
        to: nonfungibleLendManagerAddress,
        data: encodeFunctionData({
            abi: NonfungibleLendManager_abi,
            functionName: 'mint',
            args: [mintParams],
        }),
    }
    
    const handleProvide = async () => {
        const calls = [
            ...(needsApproval && approveCall ? [approveCall] : []),
            mintCall,
        ].filter(Boolean)
        const canBatch = await supports7702()
        if (canBatch && switchState) {
            await sendCalls({ calls },
                {
                    onSuccess: () => {
                        setAmountToken(['',0n])
                        console.log("success")
                    },
                    onError: (err) => {
                        console.log(err)  
                    }
                }
            )
        } else {
            // fallback: sequential transactions
            if(needsApproval  && approveConfig?.request) {await writeContract(approveConfig.request)}
            if(provideConfig?.request) {await writeContract(provideConfig.request,
                {
                    onSuccess: () => {
                        setAmountToken(['',0n])
                        console.log("success")
                    },
                    onError: (err) => {
                        console.log(err)  
                    }
                }
            )}
        }
    }

    /* Deposit */  
    let sufficient_depositA = balance0 ? balance0 >= BigInt(amountDepositA[1]) : false
    let sufficient_depositB = balance0 ? balance0 >= BigInt(amountDepositB[1]) : false
    let deposit_active = BigInt(amountDepositA[1]) + BigInt(amountDepositB[1]) > 0
    
    const tick_deposit = activePosition[0] ? activePosition[0][1] : 0
    let liquidity_deposit = amounts_to_liquidity(BigInt(amountDepositA[1]), BigInt(amountDepositB[1]), slot0[0], tick_deposit) 
    const depositParams: any = []
    depositParams.push(activePosition[4]) // depositParams[0] - tokenId
    depositParams.push(pool[0].address) // depositParams[1] - assetA
    depositParams.push(pool[1].address) // depositParams[2]] - assetB
    depositParams.push(liquidity_deposit) // mintParams[3] - liquidity
    depositParams.push(BigInt(amountDepositA[1])) //depositParams[4] - amountMaxA
    depositParams.push(BigInt(amountDepositB[1])) //depositParams[5] - amountMaxB

    const { data: depositConfig } = useSimulateContract({
        abi: NonfungibleLendManager_abi,
        address: nonfungibleLendManagerAddress as Address,
        functionName: 'provide',
        args: [depositParams],
        query: {
            enabled: sufficient_depositA && sufficient_depositB && deposit_active, // Enabled only if withdraw amount input
        },
    })
    
    const handleDeposit = async () => {
        if (depositConfig?.request) {
            writeContract(depositConfig.request,
                {
                    onSuccess: () => {
                        handlePositionClose()
                        handleDepositClose()
                        setReloadPage(true)
                    },
                    onError: (err) => {
                        console.log(err)  
                    }
                }
            )
        }
    }

    /*Take & write */
    const takeParams: any = []
    const withdrawParams: any = []

    const tick_input = activePosition[0] ? activePosition[0][1] : 0
    const take_id =  activePosition[4] ?  activePosition[4] : 0
    let amounts = liquidity_to_token_amount(withdrawLiquidity, slot0[0], tick_input)
    let min_amount0 = amounts[0] * (10n**6n -1n) / 10n**6n
    let min_amount1 = amounts[1] * (10n**6n -1n) / 10n**6n
    let max_amount = 2n**128n - 1n//uint128 max
    let available_liquidity = activePosition[3] ? activePosition[3][0] - activePosition[3][1] : 0
    let fee0 = activePosition[2] ? activePosition[2][0] : 0
    let fee1 = activePosition[2] ? activePosition[2][1] : 0
    let sufficient_liq = withdrawLiquidity ? available_liquidity >= withdrawLiquidity : true
    let input_set = (Number(withdraw0[1]) > 0 || Number(withdraw1[1]) > 0)
    let fee_available = (fee0 > 0 || fee1 > 0)

    takeParams.push(take_id)//takeParams[0] - tokenId
    takeParams.push(withdrawLiquidity) //takeParams[1] - liquidity
    takeParams.push(min_amount0)//takeParams[2] - amountMinA; 
    takeParams.push(min_amount1)//takeParams[3] - amountMinB; 
    takeParams.push(account.address)//takeParams[4] - recipient;   

    withdrawParams.push(take_id)//takeParams[0] - tokenId
    withdrawParams.push(max_amount)//takeParams[2] - amountA; 
    withdrawParams.push(max_amount)//takeParams[3] - amountB; 
    withdrawParams.push(account.address)//takeParams[4] - recipient;  

    const { data: takeConfig } = useSimulateContract({
        abi: NonfungibleLendManager_abi,
        address: nonfungibleLendManagerAddress as Address,
        functionName: 'take',
        args: [takeParams],
        query: {
            enabled: input_set && sufficient_liq, // Enabled only if lock ended and withdraw amount input
        },
    })
    const { data: withdrawConfig } = useSimulateContract({
        abi: NonfungibleLendManager_abi,
        address: nonfungibleLendManagerAddress as Address,
        functionName: 'withdraw',
        args: [withdrawParams],
        query: {
            enabled: fee_available && !input_set, // Enabled only if withdraw amount input
        },
    })

    const handleTake = () => {
        if (withdrawConfig?.request && fee_available && !input_set) {
            writeContract(withdrawConfig.request,
                {
                    onSuccess: () => {
                        handlePositionClose()
                        handleWithdrawClose()
                        setReloadPage(true)
                    },
                    onError: (err) => {
                        console.log(err)  
                    }
                })
        } else if(takeConfig?.request) {
            writeContract(takeConfig.request,
                {
                    onSuccess: () => {
                        handlePositionClose()
                        handleWithdrawClose()
                        setReloadPage(true)
                    },
                    onError: (err) => {
                        console.log(err)  
                    }
                })
        }
    }

    let withdraw = (Number(withdraw0[1]) > 0 || Number(withdraw1[1]) > 0) || (fee0 > 0 || fee1 > 0)
    const take_button = (
        <Button 
            variant="custom"    
            className="button-token-center"
            disabled={isWriting || isConfirmingBatch || _isConfirming || !withdraw || !sufficient_liq}
            onClick={handleTake}
        >
            {isWriting ? 'Confirming in wallet...' 
            : _isConfirming || isConfirmingBatch ? 'Waiting for confirmation...' 
                : sufficient_liq ? "withdraw"
                        : "insufficient liquidity available"
                    }
        </Button>
    )

    let empty = activePosition[0] ? (activePosition[0][3] + activePosition[0][7] + activePosition[0][8]) == 0 : false
    const { data: burnConfig } = useSimulateContract({
        abi: NonfungibleLendManager_abi,
        address: nonfungibleLendManagerAddress as Address,
        functionName: 'burn',
        args: [take_id],
        query: {
            enabled: empty, // Enabled only if position empty
        },
    })
    const handleBurn = () => {
        if (burnConfig?.request ) {
            writeContract(burnConfig.request,
                {
                    onSuccess: () => {
                        handlePositionClose()
                        setReloadPage(true)
                    },
                    onError: (err) => {
                        console.log(err)  
                    }
                })
            } 
    }

    /*Create Pool */
    const uni_exists = uniPoolAddress != undefined && uniPoolAddress != "0x0000000000000000000000000000000000000000"
    const kommodo_exists = kommodoPoolAddress == undefined || Number(kommodoPoolAddress) > 0 
    const tokens_exist = Number(token0.address) > 0 && Number(token1.address) > 0
    const { data: createConfig } = useSimulateContract({
        abi: NonfungibleLendManager_abi,
        address: nonfungibleLendManagerAddress as Address,
        functionName: 'deploy',
        args: [token0.address as Address, token1.address as Address, fee],
        query: {
            enabled: !kommodo_exists && tokens_exist, // Enabled only if pool does not exist and tokens exist
        },
    })
        
    const handleCreate = () => {
        if (createConfig?.request) {
            writeContract(createConfig.request,
                {
                    onSuccess: () => {
                        handlePoolClose() 
                    },
                    onError: (err) => {
                        console.log(err)  
                    }
                }
            )
        } 
    }
    const create_button = (
        <Button className="button-token-center"
            disabled={isWriting || isConfirmingBatch || _isConfirming || !uni_exists}
            onClick={handleCreate}
        >
            {isWriting ? 'Confirming in wallet...' 
            : _isConfirming || isConfirmingBatch ? 'Waiting for confirmation...' 
                : uni_exists ? 'create pool' : "No uniswap pool available"}
        </Button>
    )

/* Design - dependent on web3 functions
    /*Liquidity data card list generator*/
    const PositionItems = nft_positions.map((position: any, index: any) =>
        <div key={index}>
            <ListGroup.Item style={{border: 'none'}}>
                <Row>
                    <Col xs={2} className="d-flex align-items-center"  style={{ minWidth: "0" }}>
                        <Balancer>
                            {position[4].toString()}
                        </Balancer>
                    </Col>
                    <Col xs={3} className="d-flex align-items-center"  style={{ minWidth: "0" }}>
                        <Balancer>
                            {(position[5]).toLocaleString(undefined,{minimumFractionDigits: (rounding(position[5], max_size))})}
                        </Balancer>
                    </Col>

                    <Col>
                        <Row>
                            <Col className="d-flex align-items-center"  style={{ minWidth: "0" }}>
                                <Balancer>
                                    {
                                    (Number(position[1][0]) + Number(position[2][0])) / 10**pool[0].decimals < (1 / 10**max_size) 
                                    ? ((Number(position[1][0]) + Number(position[2][0])) / 10**pool[0].decimals + 1 / 10**max_size).toLocaleString(undefined,{minimumFractionDigits: (rounding((Number(position[1][0]) + Number(position[2][0])) / 10**pool[0].decimals, max_size))})
                                    : ((Number(position[1][0]) + Number(position[2][0])) / 10**pool[0].decimals).toLocaleString(undefined,{minimumFractionDigits: (rounding((Number(position[1][0]) + Number(position[2][0])) / 10**pool[0].decimals, max_size))})
                                    }
                                </Balancer>
                            </Col>
                            <Col className="d-flex align-items-center"  style={{ minWidth: "0" }}>
                                <Balancer>
                                    <Form.Text muted> {pool[0].symbol} </Form.Text>
                                </Balancer>
                            </Col>
                        </Row>
                        <Row> 
                            <Col className="d-flex align-items-center"  style={{ minWidth: "0" }}>
                                <Balancer>
                                    {
                                    (Number(position[1][1]) + Number(position[2][1])) / 10**pool[1].decimals < (1 / 10**max_size) 
                                    ? ((Number(position[1][1]) + Number(position[2][1])) / 10**pool[1].decimals + 1 / 10**max_size).toLocaleString(undefined,{minimumFractionDigits: (rounding((Number(position[1][1]) + Number(position[2][1])) / 10**pool[1].decimals, max_size))})
                                    : ((Number(position[1][1]) + Number(position[2][1])) / 10**pool[1].decimals).toLocaleString(undefined,{minimumFractionDigits: (rounding((Number(position[1][1]) + Number(position[2][1])) / 10**pool[1].decimals, max_size))})
                                    } 
                                </Balancer>
                            </Col> 
                            <Col className="d-flex align-items-center"  style={{ minWidth: "0" }}>
                                <Balancer>
                                    <Form.Text muted> {pool[1].symbol} </Form.Text>
                                </Balancer>
                            </Col>  
                        </Row> 
                    </Col>
                    <Col xs={1}>
                        <a onClick={() => handlePosition(position)}><FaEdit /></a>
                    </Col>
                </Row>
            </ListGroup.Item>
        </div>
    )

    return(
        <Container>
            <Row className="head">
                {/*Input card*/}

                <Alert variant="success" className="button-main">
                    Sepolia testnet only
                </Alert>

                <Card className="card">
                    <Card.Body>
                        <Card.Title className="mb-4">
                            Provide
                        </Card.Title> 
                        <InputGroup className="mb-3">
                            <Form.Control type="number" size="lg" placeholder="0" value={amountToken[0].toString()} onChange={amountInput} className="form-control-plaintext"/>
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
                            <Dropdown autoClose="outside">
                                <Dropdown.Toggle variant="white" size="sm">
                                    <b>@</b> 
                                    { 
                                    (convert_price(selectedPrices[1][0], token0.address == pool[0].address)).toLocaleString(undefined,{minimumFractionDigits: (rounding(convert_price(selectedPrices[1][0], token0.address == pool[0].address), max_size))})
                                    } <img
                                            src={token1.logoURI} 
                                            width={20} 
                                            height={20}
                                            onError={(e) => {
                                                const img = e.currentTarget;
                                                img.onerror = null; 
                                                img.src = generateTokenLogo(token1.symbol);
                                            }}
                                            style={{ borderRadius: 60 }}/> {token1.symbol}
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="text-center">
                                    <Dropdown.Item onClick={() => exponentInput(selectedPrices[0][1], selectedPrices[0][2])}>previous</Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item onClick={() => exponentInput(selectedPrices[0][1], selectedPrices[0][2])} 
                                        disabled={token0.address == pool[0].address ? price_to_sqrt(selectedPrices[0][0]) < slot0[0] : price_to_sqrt(selectedPrices[0][0]) >= slot0[0]}
                                    >
                                        {
                                         (convert_price(selectedPrices[0][0], token0.address == pool[0].address)).toLocaleString(undefined,{minimumFractionDigits: (rounding(convert_price(selectedPrices[0][0], token0.address == pool[0].address), max_size))})
                                        }
                                    </Dropdown.Item>
                                    <Dropdown.Item onClick={() => exponentInput(selectedPrices[1][1], selectedPrices[1][2])} 
                                        disabled={token0.address == pool[0].address ? price_to_sqrt(selectedPrices[1][0]) < slot0[0] : price_to_sqrt(selectedPrices[1][0]) >= slot0[0]}
                                    >
                                        {
                                         (convert_price(selectedPrices[1][0], token0.address == pool[0].address)).toLocaleString(undefined,{minimumFractionDigits: (rounding(convert_price(selectedPrices[1][0], token0.address == pool[0].address), max_size))})
                                        }
                                    </Dropdown.Item>
                                    <Dropdown.Item onClick={() => exponentInput(selectedPrices[2][1], selectedPrices[2][2])} 
                                        disabled={token0.address == pool[0].address ? price_to_sqrt(selectedPrices[2][0]) < slot0[0] : price_to_sqrt(selectedPrices[2][0]) >= slot0[0]}
                                    >
                                        {
                                         (convert_price(selectedPrices[2][0], token0.address == pool[0].address)).toLocaleString(undefined,{minimumFractionDigits: (rounding(convert_price(selectedPrices[2][0], token0.address == pool[0].address), max_size))})
                                        }
                                    </Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item onClick={() => exponentInput(selectedPrices[2][1], selectedPrices[2][2])}>next</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </InputGroup>
                        <Button className="card-button-right" variant="white" size="sm" onClick={amountMax}>
                            {token0.address == pool[0].address 
                            ? (Number(balance0) / 10**pool[0].decimals) < (1 / 10**max_size) 
                                ? (Number(balance0) / 10**pool[0].decimals + 1 / 10**max_size).toLocaleString(undefined,{minimumFractionDigits: (rounding(Number(balance0) / 10**pool[0].decimals, max_size))})
                                : (Number(balance0) / 10**pool[0].decimals).toLocaleString(undefined,{minimumFractionDigits: (rounding(Number(balance0) / 10**pool[0].decimals, max_size))})
                            : (Number(balance1) / 10**pool[1].decimals) < (1 / 10**max_size) 
                                ? (Number(balance1) / 10**pool[1].decimals + 1 / 10**max_size).toLocaleString(undefined,{minimumFractionDigits: (rounding(Number(balance1) / 10**pool[1].decimals, max_size))})
                                : (Number(balance1) / 10**pool[1].decimals).toLocaleString(undefined,{minimumFractionDigits: (rounding(Number(balance1) / 10**pool[1].decimals, max_size))})
                            } {token0.symbol}
                        </Button> 
                    </Card.Body>
                </Card>
            </Row> 
            {/*Button send txt*/}
            <Row className="row-button">
                <Connection />
            </Row>
            <Row className="row-button">
                <Form.Check
                    disabled={!supports7702()} 
                    reverse
                    type="switch"
                    label="smart account"
                    defaultChecked={switchState}
                    onClick={() => setSwitchState(!switchState)}
                />  
            </Row>
           
            {/*Position data cards*/}
            <Row className="bottom">
                <Card className="card">
                    <Card.Body>
                        <Row>
                            <Card.Title>
                                Position
                                <ButtonGroup size="sm" className="card-button-right">
                                    <Button variant="secondary" disabled={start == 0} className="card-button-right" onClick={() => setStart(start - 5)}>-</Button>
                                    <Button variant="secondary" disabled>{start+1} - {start+5} </Button>
                                    <Button variant="secondary" disabled={start+5 >= nft_balance} className="card-button-right" onClick={() => setStart(start+5)}>+</Button>
                                </ButtonGroup>
                            </Card.Title>
                        </Row>

                        <ListGroup variant="flush">
                            <ListGroup.Item disabled> 
                                <Row>
                                    <Col xs={2} className="d-flex align-items-center"  style={{ minWidth: "0" }}>
                                        <Balancer>
                                            ID
                                        </Balancer>
                                    </Col>
                                    <Col xs={3} className="d-flex align-items-center"  style={{ minWidth: "0" }}>
                                        <Balancer>
                                            Price
                                        </Balancer>
                                    </Col>
                                    <Col className="d-flex align-items-center"  style={{ minWidth: "0" }}>
                                        <Balancer>
                                            Amount
                                        </Balancer>
                                    </Col>
                                    <Col xs={1}></Col>
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
                            <Col>
                                <Dropdown>
                                    <Dropdown.Toggle variant="white" size="sm">
                                        <Form.Text muted> {(Number(multiplier) * fee) /10000}% </Form.Text>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu className="text-center">
                                        <Dropdown.Item onClick={() => setFee(100)}>
                                            {(Number(multiplier) * 100) /10000}%
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={() => setFee(500)}>
                                            {(Number(multiplier) * 500) /10000}%
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={() => setFee(3000)}>
                                            {(Number(multiplier) * 3000) /10000}%
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={() => setFee(10000)}>
                                            {(Number(multiplier) * 10000) /10000}%
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown> 
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
                    <Row className="button-token-center">
                        {!kommodo_exists ? create_button : <div/>}
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
            {/*position modal*/}    
            <Modal show={positionShow} onHide={handlePositionClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title> {pool[0].symbol} / {pool[1].symbol} <Form.Text muted>{(Number(multiplier) * fee)/10000}%</Form.Text> </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className="mb-2">
                        <Col><b>Position</b></Col>
                        <Col><b>Interest</b></Col>
                        <Col xs={2}></Col>
                    </Row>
                    <Row>
                        <Col>
                            {activePosition[1] ?
                                (Number(activePosition[1][0]) / 10**pool[0].decimals).toLocaleString(undefined,{minimumFractionDigits: rounding(Number(activePosition[1][0]) / 10**pool[0].decimals, pool[0].decimals)})
                                : ""
                            }
                        </Col>
                        <Col>
                            {activePosition[2] ?
                                (Number(activePosition[2][0]) / 10**pool[0].decimals).toLocaleString(undefined,{minimumFractionDigits: rounding(Number(activePosition[2][0]) / 10**pool[0].decimals, pool[0].decimals)})
                                : ""
                            }
                        </Col>
                        <Col xs={2}>{pool[0].symbol}</Col>
                    </Row>
                    <Row className="mb-3">
                        <Col>
                            {activePosition[1] ?
                                (Number(activePosition[1][1]) / 10**pool[1].decimals).toLocaleString(undefined,{minimumFractionDigits: rounding(Number(activePosition[1][1]) / 10**pool[1].decimals, pool[1].decimals)})
                                : ""
                            }
                        </Col>
                        <Col>
                            {activePosition[2] ?
                                (Number(activePosition[2][1]) / 10**pool[1].decimals).toLocaleString(undefined,{minimumFractionDigits: rounding(Number(activePosition[2][1]) / 10**pool[1].decimals, pool[1].decimals)})
                                : ""
                            }
                        </Col>
                        <Col xs={2}>{pool[1].symbol}</Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Row className="row-button">
                        <ButtonGroup >
                            <Button className="button-token-center" variant="outline-success" onClick={handleDepositShow}>Deposit</Button>
                            {activePosition[0] && (activePosition[0][3] + activePosition[0][7] + activePosition[0][8]) == 0
                                ? <Button className="button-token-center" variant="outline-danger" onClick={handleBurn}>Burn</Button>
                                : <Button className="button-token-center" variant="outline-danger" onClick={handleWithdrawShow}>Withdraw</Button> 
                            }
                        </ButtonGroup>
                    </Row>
                </Modal.Footer>
            </Modal>
            {/*Withdraw modal*/}    
            <Modal show={withdrawShow} onHide={handleWithdrawClose} centered scrollable>
                <Modal.Header closeButton>   
                    <Modal.Title>
                        Withdraw
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className="mb-2">
                        <Col><b>Position</b></Col>
                        <Col><b>Interest</b></Col>
                        <Col xs={2}></Col>
                    </Row>
                    <Row>
                        <Col>
                            {activePosition[1] ?
                                (Number(activePosition[1][0]) / 10**pool[0].decimals).toLocaleString(undefined,{minimumFractionDigits: rounding(Number(activePosition[1][0]) / 10**pool[0].decimals, pool[0].decimals)})
                                : ""
                            }
                        </Col>
                        <Col>
                            {activePosition[2] ?
                                (Number(activePosition[2][0]) / 10**pool[0].decimals).toLocaleString(undefined,{minimumFractionDigits: rounding(Number(activePosition[2][0]) / 10**pool[0].decimals, pool[0].decimals)})
                                : ""
                            }
                        </Col>
                        <Col xs={2}>{pool[0].symbol}</Col>
                    </Row>
                    <Row className="mb-3">
                        <Col>
                            {activePosition[1] ?
                                (Number(activePosition[1][1]) / 10**pool[1].decimals).toLocaleString(undefined,{minimumFractionDigits: rounding(Number(activePosition[1][1]) / 10**pool[1].decimals, pool[1].decimals)})
                                : ""
                            }
                        </Col>
                        <Col>
                            {activePosition[2] ?
                                (Number(activePosition[2][1]) / 10**pool[1].decimals).toLocaleString(undefined,{minimumFractionDigits: rounding(Number(activePosition[2][1]) / 10**pool[1].decimals, pool[1].decimals)})
                                : ""
                            }
                        </Col>
                        <Col xs={2}>{pool[1].symbol}</Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
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
                    <Row>
                        <Col>
                            <InputGroup className="mb-3">
                                <Form.Control disabled type="number" size="lg" placeholder="0" value={(Number(withdraw0[1]) + Number(activePosition[2] ? activePosition[2][0] : 0)) / 10**pool[0].decimals} onChange={amountWithdraw0} className="form-control-plaintext"/> 
                                <Button variant="light" size="sm" disabled>
                                    {pool[0].symbol}
                                </Button>
                            </InputGroup>
                        </Col>
                        <Col>
                            <InputGroup className="mb-3">
                                <Form.Control disabled type="number" size="lg" placeholder="0" value={(Number(withdraw1[1]) + Number(activePosition[2] ? activePosition[2][1] : 0)) / 10**pool[1].decimals} onChange={amountWithdraw1} className="form-control-plaintext"/> 
                                <Button variant="light" size="sm" disabled>
                                    {pool[1].symbol}
                                </Button>
                            </InputGroup>   
                        </Col>
                    </Row>
                    <Row className="row-button">
                        {take_button}
                    </Row>
                </Modal.Footer>
            </Modal>
            {/*Deposit modal*/}    
            <Modal show={depositShow} onHide={handleDepositClose} centered scrollable>
                <Modal.Header closeButton>   
                    <Modal.Title>
                        Deposit
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ListGroup variant="flush">
                        <Row className="mb-2">
                        <Col><b>New Position</b></Col>
                        <Col><b>Interest</b></Col>
                        <Col xs={2}></Col>
                    </Row>
                    <Row>
                        <Col>
                            {activePosition[1] ?
                                ((Number(activePosition[1][0])/ 10**pool[0].decimals) + Number(amountDepositA[0])).toLocaleString(undefined,{minimumFractionDigits: rounding(Number(activePosition[1][0]) / 10**pool[0].decimals, pool[0].decimals)})
                                : ""
                            }
                        </Col>
                        <Col>
                            {activePosition[2] ?
                                (Number(activePosition[2][0]) / 10**pool[0].decimals).toLocaleString(undefined,{minimumFractionDigits: rounding(Number(activePosition[2][0]) / 10**pool[0].decimals, pool[0].decimals)})
                                : ""
                            }
                        </Col>
                        <Col xs={2}>{pool[0].symbol}</Col>
                    </Row>
                    <Row className="mb-3">
                        <Col>
                            {activePosition[1] ?
                                ((Number(activePosition[1][1]) / 10**pool[1].decimals) + Number(amountDepositB[0])).toLocaleString(undefined,{minimumFractionDigits: rounding(Number(activePosition[1][1]) / 10**pool[1].decimals, pool[1].decimals)})
                                : ""
                            }
                        </Col>
                        <Col>
                            {activePosition[2] ?
                                (Number(activePosition[2][1]) / 10**pool[1].decimals).toLocaleString(undefined,{minimumFractionDigits: rounding(Number(activePosition[2][1]) / 10**pool[1].decimals, pool[1].decimals)})
                                : ""
                            }
                        </Col>
                        <Col xs={2}>{pool[1].symbol}</Col>
                    </Row>
                    </ListGroup>
                </Modal.Body>
                <Modal.Footer>
                    <Row>
                        <Col>
                            <InputGroup className="mb-3">
                                <Form.Control type="number" size="lg" placeholder="0" value={amountDepositA[0].toString()} onChange={depositAInput} className="form-control-plaintext"
                                
                                    disabled={activePosition[0] &&  !(slot0[0] <= tick_to_sqrt(Number(activePosition[0][1])))}
                                
                                /> 
                                <Button variant="light" size="sm" disabled>
                                    {pool[0].symbol}
                                </Button>
                            </InputGroup>
                        </Col>
                        <Col>
                            <InputGroup className="mb-3">
                                <Form.Control type="number" size="lg" placeholder="0" value={amountDepositB[0].toString()} onChange={depositBInput} className="form-control-plaintext"
                                    disabled={activePosition[0] && (slot0[0] <= tick_to_sqrt(Number(activePosition[0][1])))}
                                /> 
                                <Button variant="light" size="sm" disabled>
                                    {pool[1].symbol}
                                </Button>
                            </InputGroup>   
                        </Col>
                    </Row>
                    <Row className="row-button">
                        <Button variant="custom" className="button-token-center" onClick={handleDeposit} disabled={isWriting || _isConfirming || !deposit_active || !sufficient_depositA || !sufficient_depositA}>
                            {isWriting ? 'Confirming in wallet...' 
                                : _isConfirming ? 'Waiting for confirmation...' 
                                : "Deposit"
                            }
                        </Button>
                    </Row>
                </Modal.Footer>
            </Modal>
        </Container>
    )
}

export default Provide
import "./header.css"

//Bootstrap 
import Container from 'react-bootstrap/Container'
import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'
import Button from 'react-bootstrap/Button';

//Router
import { Link } from 'react-router-dom'

//Web3
import { useConnect, useDisconnect, useAccount } from 'wagmi'

const Header = () => {
    const { connectors, connect } = useConnect()
    const { disconnect } = useDisconnect()

    //connect button
    const account = useAccount()
    const connector_button = connectors.map((connector) => (
        <Button variant="custom" className="button" key={connector.uid} onClick={() => connect({ connector })}>
            Connect
        </Button>
    ))
    const account_button = (
        <Button variant="custom" className="button" onClick={() => disconnect()}>
            {account.address?.slice(0, -38)} ... {account.address?.slice(38)} 
        </Button>
    )
    function Connection(){     
        if(account.status === 'disconnected')  {
            return connector_button[0]
        } else {
            return account_button  
        }
    }

    return(
        <Navbar expand="sm">
            <Container fluid>
                <Navbar.Brand href="https://kommodo.org" style={{"color": "#018d4e"}}>
                <img 
                    src="kommodo-logo-green-transparent-small.png"
                    width={48} 
                    height={48} 
                    style={{ borderRadius: 60 }}
                />
                Kommodo
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav"/>
                <Navbar.Collapse>
                    <Nav className="justify-content-center">
                        <Link className="link" style={{ textDecoration: 'none' }} to='/'>Borrow</Link>
                        <Link className="link" style={{ textDecoration: 'none' }} to='/Provide'>Provide</Link>
                    </Nav>
                    <Nav className="ms-auto">
                        <Connection/>   
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar> 
    )
}

export default Header
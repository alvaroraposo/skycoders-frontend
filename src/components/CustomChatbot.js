import React, {useState, useEffect} from 'react';
import './style/style.css';
import ChatBot from 'react-simple-chatbot';
import { ThemeProvider } from 'styled-components';
import axios from 'axios';
import {validateEmail} from './../utils/validations';
import {theme, avatarStyle, bubbleOptionStyle, rootStyle, contentStyle, footerStyle, inputStyle, submitButtonStyle} from './style/theme';
const uuid = require('uuid');

function ValidaMail ({id, triggerNextStep}) {
  const [connectionParams, setConnectionParams] = useState({
    messageDeduplicationId: uuid.v1().toString(),
    messageBody: ""
  });

  const [skipLoop] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validaEmail = async () => {
      const isEmailValido = validateEmail(id);

      if(!isEmailValido) {
        setConnectionParams({
          messageBody: "O usuário deve estar logado para fazer uso de nossos serviços."          
        })
        triggerNextStep({trigger: '4'});
        setLoading(!loading);
        return;
      }
      
      const resValidaEmail = await axios.get(`https://ke1lzcm9le.execute-api.us-east-1.amazonaws.com/dev/receive/${id}`);
      const validaEmailCodePost = resValidaEmail.status;      

      if(validaEmailCodePost !== 200)
        return;

      const message = resValidaEmail.data.message;
      let messageBody = "Olá, eu me chamo Sky!"

      if(id !== message) {
        messageBody = message;
        triggerNextStep({trigger: '4'});
      }
      else {
        triggerNextStep({trigger: '2'});
      }

      setLoading(!loading);       
      setConnectionParams({
        messageBody
      });                  
    }

    validaEmail();       
  }, []);  

  return (
    <span>{(!loading) ? connectionParams.messageBody : "Um momento, por favor..."}</span>
  );
}

function BuscaMensagens (props) {
  const [messagesWaiting, setMessagesWaiting] = useState(-1);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {    
    const enviarMensagem = async () => {
      await axios.post(`https://ke1lzcm9le.execute-api.us-east-1.amazonaws.com/dev/send`, {
        messageGroupId: props.id,
        messageDeduplicationId: uuid.v1(),
        messageBody: props.previousStep.message,
      });
    }
    
    if(props.previousStep && props.previousStep.message)
      enviarMensagem();
  }, [])

  useEffect(() => {
    console.log("código!", "1061712315074-01");
    const intervalId = setInterval(async () => {
      const resConsultaMensagens = await axios.get(`https://876bvfo0j9.execute-api.us-east-1.amazonaws.com/dev/receive/${props.id}`);
      const consultaMensagensCode = resConsultaMensagens.status;      
      
      if(consultaMensagensCode === 200) {
        const resMessagesWaiting = resConsultaMensagens.data.message.messagesWaiting;
        const messageBody = resConsultaMensagens.data.message.messageBody;        

        if(resMessagesWaiting < 0)
          return;
                
        clearInterval(intervalId);

        if(resMessagesWaiting === (messagesWaiting - 1) || messagesWaiting === -1){             
          setMessagesWaiting(resMessagesWaiting); 
          setMessage(JSON.parse(messageBody));
          setLoading(!loading);
          
          if(resMessagesWaiting > 0) {                                    
            props.triggerNextStep({trigger: '2'});
          }
          else {            
            props.triggerNextStep({trigger: '3'});
            const el = document.querySelector(".rsc-content"); 
            el.scrollTo({
              left: 0,
              top: el.scrollHeight,
              behavior: 'smooth'
            });
          }
        }
      }
    }, 2000);
    return () => {
      clearInterval(intervalId);
    }
  }, [])
  

  return (
    <span>{(!loading) ? message : "Um momento, por favor..."}</span>
  );
}

function CustomChatbot ({id}) {
  
  const [conversation] = useState(
    [
      {
        id: '1',
        component: <ValidaMail id={id}/>,
        asMessage: true,
        waitAction: true,
      },
      {
        id: '2',
        component: <BuscaMensagens id={id}/>,
        asMessage: true,
        waitAction: true,
      },
      {
        id: '3',
        user: true,
        trigger: '2'
      },
      {
        id: '4',
        message: 'Volte sempre!',
        end: true
      }
    ]
  )

  return (
    <ThemeProvider theme={theme}>
      <ChatBot id={"chatId"}      
        enableSmoothScroll={true}     
        className='chat-container'
        headerTitle="Seja bem-vindo"
        avatarStyle={avatarStyle}
        floating={true}
        placeholder="Digite uma mensagem"
        recognitionEnable={true}
        recognitionLang="pt-br"
        recognitionPlaceholder="Estou ouvindo ..."
        botAvatar={process.env.PUBLIC_URL + '/skycoders.png'}
        hideUserAvatar={true}
        bubbleOptionStyle={bubbleOptionStyle}
        contentStyle={contentStyle}
        footerStyle={footerStyle}
        inputStyle={inputStyle}
        submitButtonStyle={submitButtonStyle}
        enableMobileAutoFocus={true}
        style={rootStyle}
        steps={conversation} 
      />
    </ThemeProvider>
  );
}

export default CustomChatbot;
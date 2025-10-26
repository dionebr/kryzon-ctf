import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheckIcon,
  PuzzlePieceIcon,
  UsersIcon,
  ChartBarIcon,
  BeakerIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: PuzzlePieceIcon,
      title: 'Desafios Variados',
      description: 'Web security, criptografia, binary exploitation e muito mais'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Ambiente Seguro',
      description: 'Pratique sem riscos em um ambiente totalmente isolado'
    },
    {
      icon: BeakerIcon,
      title: 'Hands-on Learning',
      description: 'Aprenda fazendo com desafios práticos e realistas'
    },
    {
      icon: ChartBarIcon,
      title: 'Progresso Trackado',
      description: 'Acompanhe sua evolução e estatísticas de performance'
    }
  ];

  const stats = [
    { label: 'Challenges Ativos', value: '4+' },
    { label: 'Categorias', value: '5' },
    { label: 'Dificuldades', value: '3' },
    { label: 'Flags Para Capturar', value: '∞' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="matrix-bg absolute inset-0"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <ShieldCheckIcon className="h-24 w-24 text-blue-500" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-green-400 bg-clip-text text-transparent">
                Kryzon CTF
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Uma plataforma local de <strong>Capture The Flag</strong> para 
              aprendizado e prática de cybersecurity
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/challenges"
                    className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 btn-glow transition-all"
                  >
                    <PuzzlePieceIcon className="h-5 w-5 mr-2" />
                    Ver Challenges
                  </Link>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-white bg-transparent hover:bg-white hover:text-gray-900 transition-all"
                  >
                    <ChartBarIcon className="h-5 w-5 mr-2" />
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 btn-glow transition-all"
                  >
                    <UsersIcon className="h-5 w-5 mr-2" />
                    Começar Agora
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-white bg-transparent hover:bg-white hover:text-gray-900 transition-all"
                  >
                    Fazer Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Por que escolher Kryzon CTF?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Uma plataforma completa para desenvolver suas habilidades em cybersecurity
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow animate-fade-in"
              >
                <feature.icon className="h-12 w-12 text-blue-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Challenge Categories Preview */}
      <div className="py-24 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Categorias de Challenges
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Diversas áreas para testar e expandir seus conhecimentos
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-lg text-white">
              <h3 className="text-xl font-bold mb-2">🌐 Web Security</h3>
              <p className="opacity-90 mb-4">SQL Injection, XSS, CSRF e mais</p>
              <span className="inline-block bg-white bg-opacity-20 px-3 py-1 rounded text-sm">
                Easy → Hard
              </span>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg text-white">
              <h3 className="text-xl font-bold mb-2">🔐 Cryptography</h3>
              <p className="opacity-90 mb-4">Cifras, hashes, steganografia</p>
              <span className="inline-block bg-white bg-opacity-20 px-3 py-1 rounded text-sm">
                Medium → Expert
              </span>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg text-white">
              <h3 className="text-xl font-bold mb-2">💻 Binary Exploitation</h3>
              <p className="opacity-90 mb-4">Buffer overflow, ROP chains</p>
              <span className="inline-block bg-white bg-opacity-20 px-3 py-1 rounded text-sm">
                Hard → Expert
              </span>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg text-white">
              <h3 className="text-xl font-bold mb-2">🖥️ System Security</h3>
              <p className="opacity-90 mb-4">Linux, SSH, privilege escalation</p>
              <span className="inline-block bg-white bg-opacity-20 px-3 py-1 rounded text-sm">
                Easy → Hard
              </span>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-lg text-white">
              <h3 className="text-xl font-bold mb-2">🕵️ Forensics</h3>
              <p className="opacity-90 mb-4">Análise de logs, memória, rede</p>
              <span className="inline-block bg-white bg-opacity-20 px-3 py-1 rounded text-sm">
                Medium → Expert
              </span>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-lg text-white">
              <h3 className="text-xl font-bold mb-2">🔍 OSINT</h3>
              <p className="opacity-90 mb-4">Investigação e coleta de dados</p>
              <span className="inline-block bg-white bg-opacity-20 px-3 py-1 rounded text-sm">
                Easy → Medium
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {!isAuthenticated && (
        <div className="py-24 bg-blue-600">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Pronto para o desafio?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Registre-se gratuitamente e comece sua jornada no mundo da cybersecurity
            </p>
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 btn-glow transition-all"
            >
              <UsersIcon className="h-6 w-6 mr-2" />
              Criar Conta Gratuita
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
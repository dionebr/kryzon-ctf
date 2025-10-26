import React from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon, HomeIcon } from '@heroicons/react/24/outline';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <ExclamationTriangleIcon className="mx-auto h-24 w-24 text-yellow-500" />
          <h1 className="mt-6 text-9xl font-bold text-gray-900 dark:text-white">
            404
          </h1>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            Página não encontrada
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            Voltar ao Início
          </Link>
          
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ou{' '}
            <Link 
              to="/challenges" 
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              veja os challenges disponíveis
            </Link>
          </p>
        </div>

        <div className="terminal mt-8 max-w-sm mx-auto">
          <code>
            HTTP/1.1 404 Not Found<br/>
            Content-Type: text/html<br/>
            X-CTF-Hint: Try /challenges instead ;)
          </code>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
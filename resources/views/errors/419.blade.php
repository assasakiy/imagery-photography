@extends('layouts.app')

@section('title', 'Sesi Kedaluwarsa')
@section('meta_description', 'Sesi Anda telah kedaluwarsa.')

@section('content')
    @include('errors.includes.layout', ['status' => '419'])
@endsection